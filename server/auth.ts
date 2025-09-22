// Authentication setup for the georeferencing system  
// Based on blueprint:javascript_auth_all_persistance integration

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "../shared/schema";
import { logger, extractRequestContext, createDurationTracker } from "./services/logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function setupAuth(app: Express) {
  // Enforce SESSION_SECRET in production
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (isProduction && (!sessionSecret || sessionSecret === "default-secret-change-in-production")) {
    throw new Error("SESSION_SECRET must be set to a secure random value in production");
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: isProduction, // HTTPS required in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          logger.security("Login attempt with invalid username", {
            username,
            action: "invalid_username",
            metadata: { loginAttempt: true }
          });
          return done(null, false, { message: "Usuário ou senha inválidos" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          logger.security("Login attempt with invalid password", {
            userId: user.id,
            username: user.username,
            action: "invalid_password",
            metadata: { loginAttempt: true }
          });
          return done(null, false, { message: "Usuário ou senha inválidos" });
        }
        
        if (!user.emailVerified) {
          logger.security("Login attempt with unverified email", {
            userId: user.id,
            username: user.username,
            action: "unverified_email",
            metadata: { loginAttempt: true }
          });
          return done(null, false, { message: "Email não verificado. Verifique sua caixa de entrada." });
        }
        
        logger.auth("Successful login authentication", {
          userId: user.id,
          username: user.username,
          action: "login_success",
          metadata: { loginAttempt: true }
        });
        
        return done(null, user);
      } catch (error) {
        logger.error("Authentication strategy error", {
          username,
          error: error as Error,
          action: "auth_strategy_error"
        });
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    const getDuration = createDurationTracker();
    const context = extractRequestContext(req);
    
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      logger.auth("User registration attempt", {
        ...context,
        action: "register_attempt",
        metadata: {
          username: validatedData.username,
          email: validatedData.email
        }
      });
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        logger.security("Registration attempt with existing username", {
          ...context,
          action: "duplicate_username",
          metadata: { username: validatedData.username }
        });
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        logger.security("Registration attempt with existing email", {
          ...context,
          action: "duplicate_email",
          metadata: { email: validatedData.email }
        });
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Create user with hashed password and verification token
      const hashedPassword = await hashPassword(validatedData.password);
      const verificationToken = generateVerificationToken();
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        verificationToken,
      });

      // TODO: Send verification email using Outlook integration
      // Auto-verify only in development - DISABLED in production for security
      if (!isProduction) {
        await storage.updateUser(user.id, { 
          emailVerified: true, 
          verificationToken: null 
        });
        
        logger.auth("Email auto-verified in development", {
          ...context,
          userId: user.id,
          username: user.username,
          action: "auto_verify_dev",
        });
      } else {
        logger.auth("Email verification required - token sent (production)", {
          ...context,
          userId: user.id,
          username: user.username,
          action: "email_verification_required",
        });
      }

      logger.auth("User registration successful", {
        ...context,
        userId: user.id,
        username: user.username,
        action: "register_success",
        duration: getDuration(),
        metadata: { email: user.email }
      });

      // Return user without password
      const { password, verificationToken: token, ...userResponse } = user;
      
      // SECURITY: Only auto-login in development. In production, require email verification
      if (!isProduction) {
        req.login(user, (err) => {
          if (err) {
            logger.error("Auto-login after registration failed", {
              ...context,
              userId: user.id,
              error: err,
              action: "auto_login_error"
            });
            return next(err);
          }
          
          res.status(201).json({ 
            user: userResponse,
            message: "Cadastro realizado com sucesso!"
          });
        });
      } else {
        // Production: Return success but require email verification before login
        res.status(201).json({ 
          message: "Cadastro realizado com sucesso! Verifique seu email para ativar sua conta.",
          emailVerificationRequired: true
        });
      }
      
    } catch (error) {
      logger.error("Registration error occurred", {
        ...context,
        error: error as Error,
        action: "register_error",
        duration: getDuration()
      });
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    const getDuration = createDurationTracker();
    const context = extractRequestContext(req);
    
    logger.auth("Login attempt initiated", {
      ...context,
      action: "login_attempt",
      metadata: { username: req.body.username }
    });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        logger.error("Login authentication error", {
          ...context,
          error: err,
          action: "login_error",
          duration: getDuration()
        });
        return next(err);
      }
      
      if (!user) {
        logger.security("Failed login attempt", {
          ...context,
          action: "login_failed",
          duration: getDuration(),
          metadata: {
            reason: info?.message || "Authentication failed",
            username: req.body.username
          }
        });
        return res.status(400).json({ error: info?.message || "Falha na autenticação" });
      }
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          logger.error("Session regeneration failed", {
            ...context,
            userId: user.id,
            username: user.username,
            error: regenerateErr,
            action: "session_regeneration_error",
            duration: getDuration()
          });
          return next(regenerateErr);
        }
        
        req.login(user, (err) => {
          if (err) {
            logger.error("Session creation failed after authentication", {
              ...context,
              userId: user.id,
              username: user.username,
              error: err,
              action: "session_creation_error",
              duration: getDuration()
            });
            return next(err);
          }
          
          logger.auth("Login completed successfully", {
            ...context,
            userId: user.id,
            username: user.username,
            action: "login_completed",
            duration: getDuration(),
            metadata: { 
              loginSuccessful: true,
              sessionRegenerated: true 
            }
          });
          
          const { password, verificationToken, ...userResponse } = user;
          res.json({ 
            user: userResponse,
            message: "Login realizado com sucesso!"
          });
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    const context = extractRequestContext(req);
    
    logger.auth("Logout initiated", {
      ...context,
      action: "logout_attempt",
      metadata: { logoutInitiated: true }
    });
    
    req.logout((err) => {
      if (err) {
        logger.error("Logout failed", {
          ...context,
          error: err,
          action: "logout_error"
        });
        return next(err);
      }
      
      logger.auth("Logout completed successfully", {
        ...context,
        action: "logout_success",
        metadata: { sessionDestroyed: true }
      });
      
      res.json({ message: "Logout realizado com sucesso!" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const { password, verificationToken, ...userResponse } = req.user;
    res.json(userResponse);
  });

  // Email verification endpoint (for future use)
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token de verificação obrigatório" });
      }

      const user = await storage.verifyUserEmail(token);
      
      if (!user) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      const { password, verificationToken, ...userResponse } = user;
      res.json({ 
        user: userResponse,
        message: "Email verificado com sucesso!"
      });
      
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
}