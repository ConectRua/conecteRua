// Main server entry point for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import { logger, extractRequestContext, createDurationTracker } from "./services/logger";

const app = express();

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const getDuration = createDurationTracker();
  const context = extractRequestContext(req);
  
  // Log incoming request
  logger.api(`${req.method} ${req.path}`, {
    ...context,
    resource: req.path,
    metadata: {
      method: req.method,
      query: req.query,
      headers: {
        'content-type': req.get('content-type'),
        'user-agent': req.get('user-agent'),
      },
    },
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = getDuration();
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level](`${req.method} ${req.path} - ${res.statusCode}`, {
      ...context,
      resource: req.path,
      duration,
      metadata: {
        statusCode: res.statusCode,
        responseTime: `${duration}ms`,
      },
    });
  });

  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://your-domain.com"] 
    : ["http://localhost:5000", "http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = registerRoutes(app);

// Structured error handling middleware (MUST be after routes)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const context = extractRequestContext(req);
  
  logger.error("Server error occurred", {
    ...context,
    resource: req.path,
    error: err,
    metadata: {
      method: req.method,
      statusCode: 500,
    },
  });
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" 
      ? "Erro interno do servidor" 
      : err.message 
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info("Server started successfully", {
    metadata: {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    },
  });
  
  // Legacy console logs for backward compatibility
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default server;