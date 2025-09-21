// Server routes for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUBSSchema, insertONGSchema, insertPacienteSchema, insertEquipamentoSocialSchema } from "../shared/schema";

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
  
  app.get("/api/ubs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const ubs = await storage.getUBS(id);
      if (!ubs) {
        return res.status(404).json({ error: "UBS não encontrada" });
      }
      res.json(ubs);
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
  
  app.get("/api/ongs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const ong = await storage.getONG(id);
      if (!ong) {
        return res.status(404).json({ error: "ONG não encontrada" });
      }
      res.json(ong);
    } catch (error) {
      console.error("Error fetching ONG:", error);
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
  
  app.get("/api/pacientes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const paciente = await storage.getPaciente(id);
      if (!paciente) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }
      res.json(paciente);
    } catch (error) {
      console.error("Error fetching Paciente:", error);
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
  
  app.get("/api/equipamentos-sociais/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const equipamento = await storage.getEquipamentoSocial(id);
      if (!equipamento) {
        return res.status(404).json({ error: "Equipamento Social não encontrado" });
      }
      res.json(equipamento);
    } catch (error) {
      console.error("Error fetching EquipamentoSocial:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // UBS CRUD routes
  app.post("/api/ubs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertUBSSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const ubs = await storage.createUBS(validation.data);
      res.json(ubs);
    } catch (error) {
      console.error("Error creating UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/ubs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const validation = insertUBSSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const ubs = await storage.updateUBS(id, validation.data);
      if (!ubs) {
        return res.status(404).json({ error: "UBS não encontrada" });
      }
      res.json(ubs);
    } catch (error) {
      console.error("Error updating UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/ubs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteUBS(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // ONGs CRUD routes
  app.post("/api/ongs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertONGSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const ong = await storage.createONG(validation.data);
      res.json(ong);
    } catch (error) {
      console.error("Error creating ONG:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/ongs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const validation = insertONGSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const ong = await storage.updateONG(id, validation.data);
      if (!ong) {
        return res.status(404).json({ error: "ONG não encontrada" });
      }
      res.json(ong);
    } catch (error) {
      console.error("Error updating ONG:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/ongs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteONG(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting ONG:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Pacientes CRUD routes
  app.post("/api/pacientes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertPacienteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const paciente = await storage.createPaciente(validation.data);
      res.json(paciente);
    } catch (error) {
      console.error("Error creating Paciente:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/pacientes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const validation = insertPacienteSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const paciente = await storage.updatePaciente(id, validation.data);
      if (!paciente) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }
      res.json(paciente);
    } catch (error) {
      console.error("Error updating Paciente:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/pacientes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deletePaciente(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting Paciente:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Equipamentos Sociais CRUD routes
  app.post("/api/equipamentos-sociais", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertEquipamentoSocialSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const equipamento = await storage.createEquipamentoSocial(validation.data);
      res.json(equipamento);
    } catch (error) {
      console.error("Error creating EquipamentoSocial:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/equipamentos-sociais/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const validation = insertEquipamentoSocialSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const equipamento = await storage.updateEquipamentoSocial(id, validation.data);
      if (!equipamento) {
        return res.status(404).json({ error: "Equipamento Social não encontrado" });
      }
      res.json(equipamento);
    } catch (error) {
      console.error("Error updating EquipamentoSocial:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/equipamentos-sociais/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteEquipamentoSocial(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting EquipamentoSocial:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Geographic route
  app.get("/api/ubs/nearby", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseInt(req.query.radius as string) : 5;
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Coordenadas inválidas" });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Coordenadas fora do intervalo válido" });
      }
      
      if (radius < 0 || radius > 100) {
        return res.status(400).json({ error: "Raio deve estar entre 0 e 100 km" });
      }
      
      const nearbyUBS = await storage.findNearbyUBS(lat, lng, radius);
      res.json(nearbyUBS);
    } catch (error) {
      console.error("Error finding nearby UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}