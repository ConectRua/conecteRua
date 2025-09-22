// Server routes for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUBSSchema, insertONGSchema, insertPacienteSchema, insertEquipamentoSocialSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use Excel ou CSV.'));
    }
  }
});

// Schemas para validação de endpoints geográficos
const geocodeSchema = z.object({
  endereco: z.string().min(1, "Endereço é obrigatório"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 00000-000")
});

const nearbySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(0.1).max(100).default(5),
  type: z.enum(["ubs", "ongs", "equipamentos", "todos"]).default("todos")
});

// Middleware de auditoria
const auditMiddleware = (action: string, tableName: string) => {
  return async (req: any, res: any, next: any) => {
    res.on('finish', async () => {
      if (req.user && res.statusCode < 400) {
        try {
          const recordId = req.params.id ? parseInt(req.params.id) : res.locals?.recordId;
          await (storage as any).logAudit(
            req.user.id,
            action,
            tableName,
            recordId,
            res.locals?.oldValues,
            res.locals?.newValues
          );
        } catch (error) {
          console.error('Erro ao registrar auditoria:', error);
        }
      }
    });
    next();
  };
};

export function registerRoutes(app: Express): Server {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // ============ ENDPOINTS GEOGRÁFICOS (FASE 3) ============
  
  // Geocodificar endereço
  app.post("/api/geocode", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = geocodeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const { endereco, cep } = validation.data;
      
      // Implementação básica - em produção usar Nominatim/ViaCEP
      const mockCoords = {
        latitude: -15.7942 + (Math.random() - 0.5) * 0.1,
        longitude: -47.8822 + (Math.random() - 0.5) * 0.1,
        endereco_completo: `${endereco}, CEP: ${cep}`,
        fonte: "mock"
      };
      
      res.json(mockCoords);
    } catch (error) {
      console.error("Erro na geocodificação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Buscar serviços próximos
  app.get("/api/nearby", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseInt(req.query.radius as string) : 5;
      const type = req.query.type as string || "todos";
      
      const validation = nearbySchema.safeParse({ lat, lng, radius, type });
      if (!validation.success) {
        return res.status(400).json({ error: "Parâmetros inválidos", details: validation.error.issues });
      }
      
      const result: any = {};
      
      if (type === "ubs" || type === "todos") {
        result.ubs = await storage.findNearbyUBS(lat, lng, radius);
      }
      
      if (type === "ongs" || type === "todos") {
        // Busca de ONGs próximas usando cálculo Haversine
        const ongsList = await storage.getONGList();
        result.ongs = ongsList
          .filter(ong => ong.latitude && ong.longitude)
          .map(ong => {
            const R = 6371; // Raio da Terra em km
            const dLat = (ong.latitude! - lat) * Math.PI / 180;
            const dLng = (ong.longitude! - lng) * Math.PI / 180;
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(ong.latitude! * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distancia = R * c;
            
            return { ...ong, distancia_km: parseFloat(distancia.toFixed(2)) };
          })
          .filter(ong => ong.distancia_km <= radius)
          .sort((a, b) => a.distancia_km - b.distancia_km);
      }
      
      if (type === "equipamentos" || type === "todos") {
        // Busca de equipamentos próximos usando cálculo Haversine
        const equipamentosList = await storage.getEquipamentosSociais();
        result.equipamentos = equipamentosList
          .filter(eq => eq.latitude && eq.longitude)
          .map(eq => {
            const R = 6371; // Raio da Terra em km
            const dLat = (eq.latitude! - lat) * Math.PI / 180;
            const dLng = (eq.longitude! - lng) * Math.PI / 180;
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(eq.latitude! * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distancia = R * c;
            
            return { ...eq, distancia_km: parseFloat(distancia.toFixed(2)) };
          })
          .filter(eq => eq.distancia_km <= radius)
          .sort((a, b) => a.distancia_km - b.distancia_km);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Erro na busca por proximidade:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Calcular distâncias de um paciente para UBS
  app.get("/api/distances/:patientId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const patientId = parseInt(req.params.patientId);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: "ID do paciente inválido" });
      }
      
      const paciente = await storage.getPaciente(patientId);
      if (!paciente) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }
      
      if (!paciente.latitude || !paciente.longitude) {
        return res.status(400).json({ error: "Paciente não possui coordenadas" });
      }
      
      const ubsList = await storage.getUBSList();
      const distancias = ubsList
        .filter(ubs => ubs.latitude && ubs.longitude)
        .map(ubs => {
          // Cálculo de distância usando fórmula haversine
          const R = 6371; // Raio da Terra em km
          const dLat = (ubs.latitude! - paciente.latitude!) * Math.PI / 180;
          const dLng = (ubs.longitude! - paciente.longitude!) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(paciente.latitude! * Math.PI / 180) * Math.cos(ubs.latitude! * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distancia = R * c;
          
          return {
            ubs_id: ubs.id,
            ubs_nome: ubs.nome,
            distancia_km: parseFloat(distancia.toFixed(2)),
            endereco: ubs.endereco
          };
        })
        .sort((a, b) => a.distancia_km - b.distancia_km);
      
      res.json({
        paciente_id: patientId,
        paciente_nome: paciente.nome,
        coordenadas: { lat: paciente.latitude, lng: paciente.longitude },
        distancias_ubs: distancias
      });
    } catch (error) {
      console.error("Erro no cálculo de distâncias:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Upload de planilhas
  app.post("/api/upload/planilha", upload.single('arquivo'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      
      const tipo = req.body.tipo as 'ubs' | 'ongs' | 'pacientes' | 'equipamentos';
      if (!['ubs', 'ongs', 'pacientes', 'equipamentos'].includes(tipo)) {
        return res.status(400).json({ error: "Tipo de entidade inválido" });
      }
      
      // Processamento real da planilha
      try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        let registrosProcessados = 0;
        let registrosImportados = 0;
        const erros: string[] = [];
        
        for (const [index, rowData] of jsonData.entries()) {
          try {
            registrosProcessados++;
            let validacao: any;
            const row = rowData as any; // Type assertion para acessar propriedades
            
            switch (tipo) {
              case 'ubs':
                validacao = insertUBSSchema.safeParse({
                  nome: row['nome'] || row['Nome'] || row['NOME'],
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'],
                  cep: row['cep'] || row['CEP'],
                  telefone: row['telefone'] || row['Telefone'],
                  email: row['email'] || row['Email'],
                  especialidades: row['especialidades'] ? [row['especialidades']] : [],
                  gestor: row['gestor'] || row['Gestor']
                });
                if (validacao.success) {
                  await storage.createUBS(validacao.data);
                  registrosImportados++;
                }
                break;
                
              case 'ongs':
                validacao = insertONGSchema.safeParse({
                  nome: row['nome'] || row['Nome'] || row['NOME'],
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'],
                  cep: row['cep'] || row['CEP'],
                  telefone: row['telefone'] || row['Telefone'],
                  email: row['email'] || row['Email'],
                  site: row['site'] || row['Site'],
                  servicos: row['servicos'] ? [row['servicos']] : [],
                  responsavel: row['responsavel'] || row['Responsavel']
                });
                if (validacao.success) {
                  await storage.createONG(validacao.data);
                  registrosImportados++;
                }
                break;
                
              case 'pacientes':
                validacao = insertPacienteSchema.safeParse({
                  nome: row['nome'] || row['Nome'] || row['NOME'],
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'],
                  cep: row['cep'] || row['CEP'],
                  telefone: row['telefone'] || row['Telefone'],
                  idade: parseInt(row['idade'] || row['Idade'] || '0'),
                  condicoesSaude: row['condicoes'] ? [row['condicoes']] : []
                });
                if (validacao.success) {
                  await storage.createPaciente(validacao.data);
                  registrosImportados++;
                }
                break;
                
              case 'equipamentos':
                validacao = insertEquipamentoSocialSchema.safeParse({
                  nome: row['nome'] || row['Nome'] || row['NOME'],
                  tipo: row['tipo'] || row['Tipo'] || 'CRAS',
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'],
                  cep: row['cep'] || row['CEP'],
                  telefone: row['telefone'] || row['Telefone'],
                  email: row['email'] || row['Email'],
                  servicos: row['servicos'] ? [row['servicos']] : []
                });
                if (validacao.success) {
                  await storage.createEquipamentoSocial(validacao.data);
                  registrosImportados++;
                }
                break;
            }
            
            if (!validacao.success) {
              erros.push(`Linha ${index + 2}: ${validacao.error.issues.map(i => i.message).join(', ')}`);
            }
            
          } catch (error) {
            erros.push(`Linha ${index + 2}: Erro ao processar registro - ${error.message}`);
          }
        }
        
        const resultado = {
          arquivo: req.file.originalname,
          tamanho: req.file.size,
          tipo: tipo,
          status: "processado",
          registros_processados: registrosProcessados,
          registros_importados: registrosImportados,
          erros: erros,
          detalhes: `Processamento concluído: ${registrosImportados}/${registrosProcessados} registros importados`
        };
        
        res.status(201).json(resultado);
      } catch (parseError: any) {
        return res.status(400).json({ 
          error: "Erro ao processar planilha", 
          detalhes: parseError.message 
        });
      }
      
    } catch (error) {
      console.error("Erro no upload:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

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
  app.post("/api/ubs", auditMiddleware('CREATE', 'ubs'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertUBSSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const ubs = await storage.createUBS(validation.data);
      res.locals.recordId = ubs.id;
      res.locals.newValues = ubs;
      res.status(201).json(ubs);
    } catch (error) {
      console.error("Error creating UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/ubs/:id", auditMiddleware('UPDATE', 'ubs'), async (req, res) => {
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
      
      const oldUBS = await storage.getUBS(id);
      const ubs = await storage.updateUBS(id, validation.data);
      if (!ubs) {
        return res.status(404).json({ error: "UBS não encontrada" });
      }
      res.locals.oldValues = oldUBS;
      res.locals.newValues = ubs;
      res.json(ubs);
    } catch (error) {
      console.error("Error updating UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/ubs/:id", auditMiddleware('DELETE', 'ubs'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const oldUBS = await storage.getUBS(id);
      const success = await storage.deleteUBS(id);
      res.locals.oldValues = oldUBS;
      res.json({ success });
    } catch (error) {
      console.error("Error deleting UBS:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // ONGs CRUD routes
  app.post("/api/ongs", auditMiddleware('CREATE', 'ongs'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertONGSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const ong = await storage.createONG(validation.data);
      res.locals.recordId = ong.id;
      res.locals.newValues = ong;
      res.status(201).json(ong);
    } catch (error) {
      console.error("Error creating ONG:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/ongs/:id", auditMiddleware('UPDATE', 'ongs'), async (req, res) => {
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
      
      const oldONG = await storage.getONG(id);
      const ong = await storage.updateONG(id, validation.data);
      if (!ong) {
        return res.status(404).json({ error: "ONG não encontrada" });
      }
      res.locals.oldValues = oldONG;
      res.locals.newValues = ong;
      res.json(ong);
    } catch (error) {
      console.error("Error updating ONG:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/ongs/:id", auditMiddleware('DELETE', 'ongs'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const oldONG = await storage.getONG(id);
      const success = await storage.deleteONG(id);
      res.locals.oldValues = oldONG;
      res.json({ success });
    } catch (error) {
      console.error("Error deleting ONG:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Pacientes CRUD routes
  app.post("/api/pacientes", auditMiddleware('CREATE', 'pacientes'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertPacienteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const paciente = await storage.createPaciente(validation.data);
      res.locals.recordId = paciente.id;
      res.locals.newValues = paciente;
      res.status(201).json(paciente);
    } catch (error) {
      console.error("Error creating Paciente:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/pacientes/:id", auditMiddleware('UPDATE', 'pacientes'), async (req, res) => {
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
      
      const oldPaciente = await storage.getPaciente(id);
      const paciente = await storage.updatePaciente(id, validation.data);
      if (!paciente) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }
      res.locals.oldValues = oldPaciente;
      res.locals.newValues = paciente;
      res.json(paciente);
    } catch (error) {
      console.error("Error updating Paciente:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/pacientes/:id", auditMiddleware('DELETE', 'pacientes'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const oldPaciente = await storage.getPaciente(id);
      const success = await storage.deletePaciente(id);
      res.locals.oldValues = oldPaciente;
      res.json({ success });
    } catch (error) {
      console.error("Error deleting Paciente:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Equipamentos Sociais CRUD routes
  app.post("/api/equipamentos-sociais", auditMiddleware('CREATE', 'equipamentos_sociais'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const validation = insertEquipamentoSocialSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const equipamento = await storage.createEquipamentoSocial(validation.data);
      res.locals.recordId = equipamento.id;
      res.locals.newValues = equipamento;
      res.status(201).json(equipamento);
    } catch (error) {
      console.error("Error creating EquipamentoSocial:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put("/api/equipamentos-sociais/:id", auditMiddleware('UPDATE', 'equipamentos_sociais'), async (req, res) => {
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
      
      const oldEquipamento = await storage.getEquipamentoSocial(id);
      const equipamento = await storage.updateEquipamentoSocial(id, validation.data);
      if (!equipamento) {
        return res.status(404).json({ error: "Equipamento Social não encontrado" });
      }
      res.locals.oldValues = oldEquipamento;
      res.locals.newValues = equipamento;
      res.json(equipamento);
    } catch (error) {
      console.error("Error updating EquipamentoSocial:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.delete("/api/equipamentos-sociais/:id", auditMiddleware('DELETE', 'equipamentos_sociais'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const oldEquipamento = await storage.getEquipamentoSocial(id);
      const success = await storage.deleteEquipamentoSocial(id);
      res.locals.oldValues = oldEquipamento;
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