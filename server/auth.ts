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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
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
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Usuário ou senha inválidos" });
        }
        
        if (!user.emailVerified) {
          return done(null, false, { message: "Email não verificado. Verifique sua caixa de entrada." });
        }
        
        return done(null, user);
      } catch (error) {
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
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
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
      // For now, we'll auto-verify for development
      await storage.updateUser(user.id, { 
        emailVerified: true, 
        verificationToken: null 
      });

      // Return user without password
      const { password, verificationToken: token, ...userResponse } = user;
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          user: userResponse,
          message: "Cadastro realizado com sucesso!"
        });
      });
      
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(400).json({ error: info?.message || "Falha na autenticação" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        const { password, verificationToken, ...userResponse } = user;
        res.json({ 
          user: userResponse,
          message: "Login realizado com sucesso!"
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
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