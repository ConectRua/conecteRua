// Main server entry point for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://your-domain.com"] 
    : ["http://localhost:5000", "http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" 
      ? "Erro interno do servidor" 
      : err.message 
  });
});

const server = registerRoutes(app);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default server;