// Server routes for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Application data routes
  app.get("/api/ubs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const ubsList = await storage.getUBSList();
      res.json(ubsList);
    } catch (error) {
      console.error("Error fetching UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/ongs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const ongsList = await storage.getONGList();
      res.json(ongsList);
    } catch (error) {
      console.error("Error fetching ONGs:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/pacientes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const pacientes = await storage.getPacientesList();
      res.json(pacientes);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/equipamentos-sociais", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const equipamentos = await storage.getEquipamentosSociais();
      res.json(equipamentos);
    } catch (error) {
      console.error("Error fetching social equipment:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}