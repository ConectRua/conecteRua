// Server routes for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { createGeocodingService } from "./services/geocoding";
import { insertUBSSchema, insertONGSchema, insertPacienteSchema, insertEquipamentoSocialSchema, insertOrientacaoEncaminhamentoSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";

// Função para detectar automaticamente o tipo de entidade baseado nos dados
function detectEntityType(row: any): 'ubs' | 'ongs' | 'equipamentos' | null {
  // Campos comuns para verificar o tipo - expandido para incluir variações
  const nome = (row['nome'] || row['Nome'] || row['NOME'] || row['name'] || 
                row['Nome da Instituição'] || row['Nome da instituição'] || 
                row['Nome do Estabelecimento'] || row['Instituição'] || '').toString().toUpperCase();
  const tipo = (row['tipo'] || row['Tipo'] || row['TIPO'] || row['type'] || 
                row['Tipo de Equipamento'] || row['Tipo de Serviço'] || 
                row['Categoria'] || row['Classificação'] || '').toString().toUpperCase();
  const descricao = (row['descricao'] || row['Descricao'] || row['description'] || 
                     row['Descrição'] || row['Serviços'] || '').toString().toUpperCase();
  
  // Combinar todos os campos para análise
  const textoCombinado = `${nome} ${tipo} ${descricao}`.toUpperCase();
  
  // Detectar UBS
  if (textoCombinado.includes('UBS') || 
      textoCombinado.includes('UNIDADE BÁSICA') ||
      textoCombinado.includes('UNIDADE BASICA') ||
      textoCombinado.includes('POSTO DE SAÚDE') ||
      textoCombinado.includes('POSTO DE SAUDE') ||
      textoCombinado.includes('CENTRO DE SAÚDE') ||
      textoCombinado.includes('CENTRO DE SAUDE')) {
    return 'ubs';
  }
  
  // Detectar Equipamentos Sociais (CAPS, CRAS, etc.)
  if (textoCombinado.includes('CAPS') ||
      textoCombinado.includes('CRAS') ||
      textoCombinado.includes('CENTRO DE ATENÇÃO PSICOSSOCIAL') ||
      textoCombinado.includes('CENTRO DE REFERÊNCIA') ||
      textoCombinado.includes('EQUIPAMENTO SOCIAL') ||
      textoCombinado.includes('CENTRO SOCIAL')) {
    return 'equipamentos';
  }
  
  // Se tem campos típicos de ONG (responsavel, servicos, site) mas não é UBS nem equipamento
  if ((row['responsavel'] || row['presidente'] || row['diretor'] || 
       row['servicos'] || row['atividades'] || row['site'] || row['website']) &&
      !textoCombinado.includes('UBS') && !textoCombinado.includes('CAPS') && !textoCombinado.includes('CRAS')) {
    return 'ongs';
  }
  
  return null; // Não foi possível detectar automaticamente
}

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
      'text/csv',
      'application/csv'
    ];
    // Permitir arquivos com extensões corretas mesmo se o MIME type não for detectado corretamente
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
    
    if (allowedTypes.includes(file.mimetype) || hasValidExtension) {
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

  // Criar instância do serviço de geocodificação
  const geocodingService = createGeocodingService(storage);

  // ============ ENDPOINTS GEOGRÁFICOS (FASE 4) ============
  
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
      
      // Usar serviço real de geocodificação com Nominatim e ViaCEP
      const result = await geocodingService.geocodeAddress(endereco, cep);
      
      // Transformar resultado para formato compatível com API anterior
      const response = {
        latitude: result.coordinates?.latitude || null,
        longitude: result.coordinates?.longitude || null,
        endereco_completo: `${endereco}, CEP: ${cep}`,
        fonte: result.source,
        sucesso: !!result.coordinates,
        erro: result.error || null
      };
      
      if (!result.coordinates) {
        return res.status(404).json({
          error: "Não foi possível geocodificar o endereço",
          details: result.error || "Coordenadas não encontradas",
          ...response
        });
      }
      
      res.json(response);
    } catch (error) {
      console.error("Erro na geocodificação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Reverse geocoding: buscar endereço e CEP a partir de coordenadas
  app.post("/api/geocode/reverse", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const { latitude, longitude } = req.body;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Latitude e longitude devem ser números" });
      }
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Coordenadas inválidas" });
      }
      
      const result = await geocodingService.reverseGeocode(latitude, longitude);
      
      if (!result) {
        return res.status(404).json({ 
          error: "Não foi possível encontrar endereço para as coordenadas fornecidas" 
        });
      }
      
      res.json({
        sucesso: true,
        endereco: result.endereco,
        cep: result.cep,
        bairro: result.bairro,
        cidade: result.cidade,
        estado: result.estado
      });
    } catch (error) {
      console.error("Erro no reverse geocoding:", error);
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
      
      // Transformar resultado para formato unificado esperado pelo frontend
      const servicosUnificados: any[] = [];
      
      // Adicionar UBS
      if (result.ubs) {
        result.ubs.forEach((ubs: any) => {
          servicosUnificados.push({
            id: ubs.id.toString(),
            nome: ubs.nome,
            endereco: ubs.endereco,
            telefone: ubs.telefone || '',
            tipo: 'UBS' as const,
            distancia: ubs.distancia_km || 0,
            horarioFuncionamento: ubs.horarioFuncionamento,
            especialidades: ubs.especialidades || []
          });
        });
      }
      
      // Adicionar ONGs
      if (result.ongs) {
        result.ongs.forEach((ong: any) => {
          servicosUnificados.push({
            id: ong.id.toString(),
            nome: ong.nome,
            endereco: ong.endereco,
            telefone: ong.telefone || '',
            tipo: 'ONG' as const,
            distancia: ong.distancia_km || 0,
            horarioFuncionamento: ong.horarioFuncionamento,
            servicos: ong.servicos || []
          });
        });
      }
      
      // Adicionar Equipamentos Sociais
      if (result.equipamentos) {
        result.equipamentos.forEach((eq: any) => {
          servicosUnificados.push({
            id: eq.id.toString(),
            nome: eq.nome,
            endereco: eq.endereco,
            telefone: eq.telefone || '',
            tipo: 'Equipamento Social' as const,
            distancia: eq.distancia_km || 0,
            horarioFuncionamento: eq.horarioFuncionamento,
            servicos: eq.servicos || []
          });
        });
      }
      
      // Ordenar por distância
      servicosUnificados.sort((a, b) => a.distancia - b.distancia);
      
      res.json({
        ...result,
        servicos: servicosUnificados,
        total: servicosUnificados.length
      });
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

  // Geocodificação em lote
  app.post("/api/geocode/batch", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const addressesSchema = z.object({
        addresses: z.array(z.object({
          id: z.string().optional(),
          endereco: z.string().min(1, "Endereço é obrigatório"),
          cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 00000-000")
        })).min(1).max(100) // Máximo 100 endereços por vez
      });
      
      const validation = addressesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.issues });
      }
      
      const { addresses } = validation.data;
      const results = [];
      
      // Processar em lotes pequenos para não sobrecarregar as APIs
      for (const address of addresses) {
        try {
          const result = await geocodingService.geocodeAddress(address.endereco, address.cep);
          
          results.push({
            id: address.id,
            endereco: address.endereco,
            cep: address.cep,
            latitude: result.coordinates?.latitude || null,
            longitude: result.coordinates?.longitude || null,
            fonte: result.source,
            sucesso: !!result.coordinates,
            erro: result.error || null
          });
          
          // Pequeno delay entre requisições para ser respeitoso com as APIs
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          results.push({
            id: address.id,
            endereco: address.endereco,
            cep: address.cep,
            latitude: null,
            longitude: null,
            fonte: 'error',
            sucesso: false,
            erro: (error as Error).message || 'Erro desconhecido'
          });
        }
      }
      
      const successCount = results.filter(r => r.sucesso).length;
      const errorCount = results.length - successCount;
      
      res.json({
        resultados: results,
        estatisticas: {
          total: results.length,
          sucessos: successCount,
          erros: errorCount,
          taxa_sucesso: Math.round((successCount / results.length) * 100)
        }
      });
      
    } catch (error) {
      console.error("Erro na geocodificação em lote:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Rota para preview da planilha
  app.post('/api/upload/preview', upload.single('arquivo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
      }

      const tipo = req.body.tipo as 'ubs' | 'ongs' | 'pacientes' | 'equipamentos' | 'auto' | undefined;
      const permitirDetecaoAutomatica = tipo === 'auto' || tipo === undefined || !['ubs', 'ongs', 'pacientes', 'equipamentos'].includes(tipo);

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const registrosProcessados: any[] = [];
      const erros: string[] = [];

      for (const [index, rowData] of jsonData.entries()) {
        const row = rowData as any;
        
        // Detectar tipo automaticamente se permitido
        let tipoFinal = tipo;
        if (permitirDetecaoAutomatica) {
          const tipoDetectado = detectEntityType(row);
          if (tipoDetectado) {
            tipoFinal = tipoDetectado;
          } else if (!tipo || tipo === 'auto') {
            erros.push(`Linha ${index + 2}: Não foi possível detectar o tipo automaticamente`);
            continue;
          }
        }

        // Extrair dados baseado no tipo com campos expandidos
        let dadosExtraidos: any = {
          id: `preview_${index}`,
          tipo: tipoFinal,
          linha: index + 2,
          valido: true
        };

        // Função helper para extrair endereço completo
        const extrairEndereco = () => {
          const bairro = row['Bairro'] || row['Bairro/Região'] || row['Região'] || row['Regional'] || '';
          const enderecoBase = row['endereco'] || row['Endereco'] || row['ENDERECO'] || row['endereço'] || 
                              row['Endereço'] || row['address'] || row['Endereço'] || row['Localização'] || row['Local'] || '';
          return bairro && !enderecoBase.includes(bairro) ? `${enderecoBase}, ${bairro}`.trim() : enderecoBase;
        };

        switch (tipoFinal) {
          case 'ubs':
            dadosExtraidos = {
              ...dadosExtraidos,
              nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['Name'] ||
                    row['Nome da Instituição'] || row['Nome do Estabelecimento'] || row['Instituição'] || '',
              endereco: extrairEndereco(),
              cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || row['CEP/Código Postal'] || '',
              telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] ||
                       row['Contato'] || row['Tel'] || row['Fone'] || '',
              email: row['email'] || row['Email'] || row['e-mail'] || row['E-mail'] || row['E-Mail'] || '',
              horarioFuncionamento: row['horario'] || row['horario_funcionamento'] || row['horarioFuncionamento'] || 
                                   row['Horario'] || row['funcionamento'] || row['Horário de Funcionamento'] || row['Horário'] || ''
            };
            break;
            
          case 'ongs':
            dadosExtraidos = {
              ...dadosExtraidos,
              nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['organizacao'] ||
                    row['Nome da Instituição'] || row['Nome da ONG'] || row['Organização'] || row['Instituição'] || '',
              endereco: extrairEndereco(),
              cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || row['CEP/Código Postal'] || '',
              telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] || 
                       row['contato'] || row['Contato'] || row['Tel'] || row['Fone'] || '',
              email: row['email'] || row['Email'] || row['e-mail'] || row['E-mail'] || row['contato_email'] || row['E-Mail'] || '',
              site: row['site'] || row['Site'] || row['website'] || row['url'] || row['pagina'] || '',
              responsavel: row['responsavel'] || row['Responsavel'] || row['coordenador'] || row['diretor'] || row['presidente'] || ''
            };
            break;
            
          case 'equipamentos':
            dadosExtraidos = {
              ...dadosExtraidos,
              nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['equipamento'] ||
                    row['Nome da Instituição'] || row['Nome do Equipamento'] || row['Instituição'] || '',
              tipoEquipamento: row['tipo'] || row['Tipo'] || row['category'] || row['categoria'] || 
                    row['Tipo de Equipamento'] || row['Tipo de Serviço'] || row['Classificação'] || 'Equipamento Social',
              endereco: extrairEndereco(),
              cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || row['CEP/Código Postal'] || '',
              telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] || 
                       row['contato'] || row['Contato'] || row['Tel'] || row['Fone'] || '',
              email: row['email'] || row['Email'] || row['e-mail'] || row['E-mail'] || row['contato_email'] || row['E-Mail'] || '',
              horarioFuncionamento: row['horario'] || row['horario_funcionamento'] || row['Horário'] || 
                                   row['Horário de Funcionamento'] || row['funcionamento'] || ''
            };
            break;
            
          case 'pacientes':
            dadosExtraidos = {
              ...dadosExtraidos,
              nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['paciente'] || '',
              endereco: extrairEndereco(),
              cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || '',
              telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] || row['contato'] || '',
              idade: parseInt(row['idade'] || row['Idade'] || row['age'] || '0') || null
            };
            break;
        }

        // Validar dados extraídos
        if (!dadosExtraidos.nome) {
          dadosExtraidos.valido = false;
          dadosExtraidos.erro = 'Nome não encontrado';
          erros.push(`Linha ${index + 2}: Nome não encontrado`);
        }

        registrosProcessados.push(dadosExtraidos);
      }

      res.json({
        success: true,
        registrosProcessados,
        totalLinhas: jsonData.length,
        totalValidos: registrosProcessados.filter(r => r.valido).length,
        erros
      });
    } catch (error: any) {
      console.error('[PREVIEW] Erro ao processar planilha:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar planilha para preview',
        error: error.message 
      });
    }
  });

  // Rota para salvar registros selecionados
  app.post('/api/upload/confirmar', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const { registros } = req.body;
      
      if (!registros || !Array.isArray(registros)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nenhum registro enviado para importação' 
        });
      }

      let registrosImportados = 0;
      const erros: string[] = [];

      for (const registro of registros) {
        try {
          let validacao: any;
          
          switch (registro.tipo) {
            case 'ubs':
              const ubsData = {
                nome: registro.nome,
                endereco: registro.endereco,
                cep: registro.cep,
                telefone: registro.telefone,
                email: registro.email,
                horarioFuncionamento: registro.horarioFuncionamento,
                especialidades: registro.especialidades || [],
                gestor: registro.gestor
              };
              
              // Geocodificar se endereço e CEP estão presentes
              if (ubsData.endereco && ubsData.cep) {
                try {
                  const geocodeResult = await geocodingService.geocodeAddress(ubsData.endereco, ubsData.cep);
                  if (geocodeResult.coordinates) {
                    (ubsData as any).latitude = geocodeResult.coordinates.latitude;
                    (ubsData as any).longitude = geocodeResult.coordinates.longitude;
                  }
                } catch (geoError) {
                  console.warn(`Erro ao geocodificar UBS ${ubsData.nome}:`, geoError);
                }
              }
              
              validacao = insertUBSSchema.safeParse(ubsData);
              if (validacao.success) {
                await storage.createUBS(validacao.data);
                registrosImportados++;
              } else {
                erros.push(`${registro.nome}: ${validacao.error.issues.map(i => i.message).join(', ')}`);
              }
              break;
              
            case 'ongs':
              const ongData = {
                nome: registro.nome,
                endereco: registro.endereco,
                cep: registro.cep,
                telefone: registro.telefone,
                email: registro.email,
                site: registro.site,
                servicos: registro.servicos || [],
                responsavel: registro.responsavel
              };
              
              // Geocodificar
              if (ongData.endereco && ongData.cep) {
                try {
                  const geocodeResult = await geocodingService.geocodeAddress(ongData.endereco, ongData.cep);
                  if (geocodeResult.coordinates) {
                    (ongData as any).latitude = geocodeResult.coordinates.latitude;
                    (ongData as any).longitude = geocodeResult.coordinates.longitude;
                  }
                } catch (geoError) {
                  console.warn(`Erro ao geocodificar ONG ${ongData.nome}:`, geoError);
                }
              }
              
              validacao = insertONGSchema.safeParse(ongData);
              if (validacao.success) {
                await storage.createONG(validacao.data);
                registrosImportados++;
              } else {
                erros.push(`${registro.nome}: ${validacao.error.issues.map(i => i.message).join(', ')}`);
              }
              break;
              
            case 'equipamentos':
              const equipamentoData = {
                nome: registro.nome,
                tipo: registro.tipoEquipamento || 'Equipamento Social',
                endereco: registro.endereco,
                cep: registro.cep,
                telefone: registro.telefone,
                email: registro.email,
                servicos: registro.servicos || [],
                capacidade: registro.capacidade
              };
              
              // Geocodificar
              if (equipamentoData.endereco && equipamentoData.cep) {
                try {
                  const geocodeResult = await geocodingService.geocodeAddress(equipamentoData.endereco, equipamentoData.cep);
                  if (geocodeResult.coordinates) {
                    (equipamentoData as any).latitude = geocodeResult.coordinates.latitude;
                    (equipamentoData as any).longitude = geocodeResult.coordinates.longitude;
                  }
                } catch (geoError) {
                  console.warn(`Erro ao geocodificar equipamento ${equipamentoData.nome}:`, geoError);
                }
              }
              
              validacao = insertEquipamentoSocialSchema.safeParse(equipamentoData);
              if (validacao.success) {
                await storage.createEquipamentoSocial(validacao.data);
                registrosImportados++;
              } else {
                erros.push(`${registro.nome}: ${validacao.error.issues.map(i => i.message).join(', ')}`);
              }
              break;
              
            case 'pacientes':
              const pacienteData = {
                nome: registro.nome,
                endereco: registro.endereco,
                cep: registro.cep,
                telefone: registro.telefone,
                idade: registro.idade,
                condicoesSaude: registro.condicoesSaude || []
              };
              
              // Geocodificar
              if (pacienteData.endereco && pacienteData.cep) {
                try {
                  const geocodeResult = await geocodingService.geocodeAddress(pacienteData.endereco, pacienteData.cep);
                  if (geocodeResult.coordinates) {
                    (pacienteData as any).latitude = geocodeResult.coordinates.latitude;
                    (pacienteData as any).longitude = geocodeResult.coordinates.longitude;
                  }
                } catch (geoError) {
                  console.warn(`Erro ao geocodificar paciente ${pacienteData.nome}:`, geoError);
                }
              }
              
              validacao = insertPacienteSchema.safeParse(pacienteData);
              if (validacao.success) {
                await storage.createPaciente(validacao.data);
                registrosImportados++;
              } else {
                erros.push(`${registro.nome}: ${validacao.error.issues.map(i => i.message).join(', ')}`);
              }
              break;
          }
        } catch (error: any) {
          erros.push(`${registro.nome}: ${error.message}`);
        }
      }

      res.json({
        success: true,
        message: `${registrosImportados} de ${registros.length} registros importados com sucesso`,
        registrosImportados,
        erros
      });
    } catch (error: any) {
      console.error('[CONFIRMAR] Erro ao importar registros:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao importar registros selecionados',
        error: error.message 
      });
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
      
      let tipo = req.body.tipo as 'ubs' | 'ongs' | 'pacientes' | 'equipamentos' | 'auto';
      
      // Se tipo não for especificado ou for 'auto', tentar detecção automática
      const permitirDetecaoAutomatica = !tipo || tipo === 'auto' || !['ubs', 'ongs', 'pacientes', 'equipamentos'].includes(tipo);
      
      if (!permitirDetecaoAutomatica && !['ubs', 'ongs', 'pacientes', 'equipamentos'].includes(tipo)) {
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
            
            // Detectar tipo automaticamente se permitido
            let tipoFinal = tipo;
            if (permitirDetecaoAutomatica) {
              const tipoDetectado = detectEntityType(row);
              if (tipoDetectado) {
                tipoFinal = tipoDetectado;
              } else if (!tipo || tipo === 'auto') {
                // Se não foi possível detectar e não tem tipo padrão, pular esta linha
                erros.push(`Linha ${index + 2}: Não foi possível detectar o tipo automaticamente`);
                continue;
              }
            }
            
            switch (tipoFinal) {
              case 'ubs':
                const ubsData = {
                  nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['Name'] ||
                        row['Nome da Instituição'] || row['Nome do Estabelecimento'] || row['Instituição'],
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'] || row['endereço'] || row['Endereço'] || row['address'] ||
                            row['Endereço'] || row['Localização'] || row['Local'],
                  cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || row['CEP/Código Postal'],
                  telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] ||
                           row['Contato'] || row['Tel'] || row['Fone'],
                  email: row['email'] || row['Email'] || row['e-mail'] || row['E-mail'] || row['E-Mail'],
                  horarioFuncionamento: row['horario'] || row['horario_funcionamento'] || row['horarioFuncionamento'] || 
                                       row['Horario'] || row['funcionamento'] || row['Horário de Funcionamento'] || row['Horário'],
                  especialidades: row['especialidades'] || row['Especialidades'] || row['especialidade'] || row['servicos_medicos'] ? 
                    String(row['especialidades'] || row['Especialidades'] || row['especialidade'] || row['servicos_medicos']).split(',').map(s => s.trim()) : [],
                  gestor: row['gestor'] || row['Gestor'] || row['responsavel'] || row['gerente'] || row['coordenador']
                };
                
                // Geocodificar se endereço e CEP estão presentes
                if (ubsData.endereco && ubsData.cep) {
                  try {
                    const geocodeResult = await geocodingService.geocodeAddress(ubsData.endereco, ubsData.cep);
                    if (geocodeResult.coordinates) {
                      (ubsData as any).latitude = geocodeResult.coordinates.latitude;
                      (ubsData as any).longitude = geocodeResult.coordinates.longitude;
                    }
                  } catch (geoError) {
                    // Continuar mesmo se geocodificação falhar
                    console.warn(`Erro ao geocodificar UBS ${ubsData.nome}:`, geoError);
                  }
                }
                
                validacao = insertUBSSchema.safeParse(ubsData);
                if (validacao.success) {
                  await storage.createUBS(validacao.data);
                  registrosImportados++;
                } else {
                  erros.push(`Linha ${index + 2}: Erro na validação UBS - ${validacao.error.issues.map(i => i.message).join(', ')}`);
                }
                break;
                
              case 'ongs':
                const ongData = {
                  nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['organizacao'] ||
                        row['Nome da Instituição'] || row['Nome da ONG'] || row['Organização'] || row['Instituição'],
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'] || row['endereço'] || row['Endereço'] || row['address'] ||
                            row['Endereço'] || row['Localização'] || row['Local'],
                  cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || row['CEP/Código Postal'],
                  telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] || row['contato'] ||
                           row['Contato'] || row['Tel'] || row['Fone'],
                  email: row['email'] || row['Email'] || row['e-mail'] || row['E-mail'] || row['contato_email'] || row['E-Mail'],
                  site: row['site'] || row['Site'] || row['website'] || row['url'] || row['pagina'],
                  servicos: row['servicos'] || row['Servicos'] || row['atividades'] || row['areas_atuacao'] ? 
                    String(row['servicos'] || row['Servicos'] || row['atividades'] || row['areas_atuacao']).split(',').map(s => s.trim()) : [],
                  responsavel: row['responsavel'] || row['Responsavel'] || row['coordenador'] || row['diretor'] || row['presidente']
                };
                
                // Geocodificar se endereço e CEP estão presentes
                if (ongData.endereco && ongData.cep) {
                  try {
                    const geocodeResult = await geocodingService.geocodeAddress(ongData.endereco, ongData.cep);
                    if (geocodeResult.coordinates) {
                      (ongData as any).latitude = geocodeResult.coordinates.latitude;
                      (ongData as any).longitude = geocodeResult.coordinates.longitude;
                    }
                  } catch (geoError) {
                    console.warn(`Erro ao geocodificar ONG ${ongData.nome}:`, geoError);
                  }
                }
                
                validacao = insertONGSchema.safeParse(ongData);
                if (validacao.success) {
                  await storage.createONG(validacao.data);
                  registrosImportados++;
                } else {
                  erros.push(`Linha ${index + 2}: Erro na validação ONG - ${validacao.error.issues.map(i => i.message).join(', ')}`);
                }
                break;
                
              case 'pacientes':
                const pacienteData = {
                  nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['paciente'],
                  endereco: row['endereco'] || row['Endereco'] || row['ENDERECO'] || row['endereço'] || row['Endereço'] || row['address'],
                  cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'],
                  telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] || row['contato'],
                  idade: parseInt(row['idade'] || row['Idade'] || row['age'] || '0') || undefined,
                  condicoesSaude: row['condicoes'] || row['condicoesSaude'] || row['condicoes_saude'] || row['problemas_saude'] || row['doencas'] ? 
                    String(row['condicoes'] || row['condicoesSaude'] || row['condicoes_saude'] || row['problemas_saude'] || row['doencas']).split(',').map(s => s.trim()) : []
                };
                
                // Geocodificar se endereço e CEP estão presentes
                if (pacienteData.endereco && pacienteData.cep) {
                  try {
                    const geocodeResult = await geocodingService.geocodeAddress(pacienteData.endereco, pacienteData.cep);
                    if (geocodeResult.coordinates) {
                      (pacienteData as any).latitude = geocodeResult.coordinates.latitude;
                      (pacienteData as any).longitude = geocodeResult.coordinates.longitude;
                    }
                  } catch (geoError) {
                    console.warn(`Erro ao geocodificar paciente ${pacienteData.nome}:`, geoError);
                  }
                }
                
                validacao = insertPacienteSchema.safeParse(pacienteData);
                if (validacao.success) {
                  await storage.createPaciente(validacao.data);
                  registrosImportados++;
                } else {
                  erros.push(`Linha ${index + 2}: Erro na validação Paciente - ${validacao.error.issues.map(i => i.message).join(', ')}`);
                }
                break;
                
              case 'equipamentos':
                // Para endereço, incluir o bairro se ele vier separado
                const bairro = row['Bairro'] || row['Bairro/Região'] || row['Região'] || row['Regional'] || '';
                const enderecoBase = row['endereco'] || row['Endereco'] || row['ENDERECO'] || row['endereço'] || row['Endereço'] || row['address'] ||
                                    row['Endereço'] || row['Localização'] || row['Local'] || '';
                const enderecoCompleto = bairro && !enderecoBase.includes(bairro) ? `${enderecoBase}, ${bairro}`.trim() : enderecoBase;
                
                const equipamentoData = {
                  nome: row['nome'] || row['Nome'] || row['NOME'] || row['name'] || row['equipamento'] ||
                        row['Nome da Instituição'] || row['Nome do Equipamento'] || row['Instituição'],
                  tipo: row['tipo'] || row['Tipo'] || row['category'] || row['categoria'] || 
                        row['Tipo de Equipamento'] || row['Tipo de Serviço'] || row['Classificação'] || 'Equipamento Social',
                  endereco: enderecoCompleto || 'Endereço não informado',
                  cep: row['cep'] || row['CEP'] || row['codigo_postal'] || row['postal_code'] || row['CEP/Código Postal'] || '00000-000',
                  telefone: row['telefone'] || row['Telefone'] || row['fone'] || row['phone'] || row['celular'] || row['contato'] ||
                           row['Contato'] || row['Tel'] || row['Fone'],
                  email: row['email'] || row['Email'] || row['e-mail'] || row['E-mail'] || row['contato_email'] || row['E-Mail'],
                  servicos: row['servicos'] || row['Servicos'] || row['atividades'] || row['programas'] || row['areas_atuacao'] || 
                           row['Tipo de Equipamento'] || row['Serviços Oferecidos'] ? 
                    String(row['servicos'] || row['Servicos'] || row['atividades'] || row['programas'] || row['areas_atuacao'] || 
                           row['Tipo de Equipamento'] || row['Serviços Oferecidos']).split(',').map(s => s.trim()) : [],
                  capacidade: row['capacidade'] || row['Capacidade'] || row['vagas'] || row['Vagas'] ? 
                    parseInt(row['capacidade'] || row['Capacidade'] || row['vagas'] || row['Vagas']) : null
                };
                
                // Geocodificar se endereço e CEP estão presentes
                if (equipamentoData.endereco && equipamentoData.cep) {
                  try {
                    const geocodeResult = await geocodingService.geocodeAddress(equipamentoData.endereco, equipamentoData.cep);
                    if (geocodeResult.coordinates) {
                      (equipamentoData as any).latitude = geocodeResult.coordinates.latitude;
                      (equipamentoData as any).longitude = geocodeResult.coordinates.longitude;
                    }
                  } catch (geoError) {
                    console.warn(`Erro ao geocodificar equipamento ${equipamentoData.nome}:`, geoError);
                  }
                }
                
                validacao = insertEquipamentoSocialSchema.safeParse(equipamentoData);
                if (validacao.success) {
                  await storage.createEquipamentoSocial(validacao.data);
                  registrosImportados++;
                } else {
                  erros.push(`Linha ${index + 2}: Erro na validação Equipamento - ${validacao.error.issues.map(i => i.message).join(', ')}`);
                }
                break;
            }
            
            // Validação já foi feita em cada caso específico
            
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

  // Estatísticas endpoint
  app.get("/api/estatisticas", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      // Buscar dados de todas as entidades
      const [ubsList, ongsList, pacientesList, equipamentosSociais] = await Promise.all([
        storage.getUBSList(),
        storage.getONGList(),
        storage.getPacientesList(),
        storage.getEquipamentosSociais()
      ]);
      
      // Calcular estatísticas básicas
      const pacientesVinculados = pacientesList.filter(p => p.ubsMaisProximaId).length;
      
      // Calcular cobertura por região (simplificado)
      const coberturaPorRegiao: Record<string, number> = {};
      pacientesList.forEach(paciente => {
        const regiao = paciente.endereco.includes('Samambaia') ? 'Samambaia' : 
                      paciente.endereco.includes('Recanto') ? 'Recanto das Emas' :
                      paciente.endereco.includes('Águas Claras') ? 'Águas Claras' : 'Outras';
        coberturaPorRegiao[regiao] = (coberturaPorRegiao[regiao] || 0) + 1;
      });
      
      // Calcular distância média
      const pacientesComDistancia = pacientesList.filter(p => p.distanciaUbs !== null);
      const distanciaMedia = pacientesComDistancia.length > 0 
        ? pacientesComDistancia.reduce((acc, p) => acc + (p.distanciaUbs || 0), 0) / pacientesComDistancia.length
        : 0;
      
      const estatisticas = {
        totalUBS: ubsList.length,
        totalONGs: ongsList.length,
        totalPacientes: pacientesList.length,
        totalEquipamentosSociais: equipamentosSociais.length,
        pacientesVinculados,
        coberturaPorRegiao,
        distanciaMedia: Math.round(distanciaMedia * 100) / 100
      };
      
      res.json(estatisticas);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Endpoints para reclassificação de registros
  app.post("/api/reclassificar", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const { id, tipoOrigem, tipoDestino } = req.body;
      
      if (!id || !tipoOrigem || !tipoDestino) {
        return res.status(400).json({ error: "ID, tipo de origem e tipo de destino são obrigatórios" });
      }
      
      if (!['ubs', 'ongs', 'equipamentos'].includes(tipoOrigem) || 
          !['ubs', 'ongs', 'equipamentos'].includes(tipoDestino)) {
        return res.status(400).json({ error: "Tipos inválidos. Use: ubs, ongs, equipamentos" });
      }
      
      if (tipoOrigem === tipoDestino) {
        return res.status(400).json({ error: "Tipo de origem e destino não podem ser iguais" });
      }
      
      // Buscar registro original
      let registroOriginal: any;
      switch (tipoOrigem) {
        case 'ubs':
          registroOriginal = await storage.getUBS(id);
          break;
        case 'ongs':
          registroOriginal = await storage.getONG(id);
          break;
        case 'equipamentos':
          registroOriginal = await storage.getEquipamentoSocial(id);
          break;
      }
      
      if (!registroOriginal) {
        return res.status(404).json({ error: "Registro não encontrado" });
      }
      
      // Mapear dados para o novo tipo
      const dadosBase = {
        nome: registroOriginal.nome,
        endereco: registroOriginal.endereco,
        cep: registroOriginal.cep,
        telefone: registroOriginal.telefone,
        email: registroOriginal.email,
        latitude: registroOriginal.latitude,
        longitude: registroOriginal.longitude
      };
      
      let novoRegistro: any;
      switch (tipoDestino) {
        case 'ubs':
          novoRegistro = {
            ...dadosBase,
            horarioFuncionamento: registroOriginal.horarioFuncionamento || registroOriginal.horario || "08:00-17:00",
            especialidades: registroOriginal.especialidades || registroOriginal.servicos || [],
            gestor: registroOriginal.gestor || registroOriginal.responsavel || ""
          };
          const ubsValidacao = insertUBSSchema.safeParse(novoRegistro);
          if (!ubsValidacao.success) {
            return res.status(400).json({ 
              error: "Dados inválidos para UBS", 
              detalhes: ubsValidacao.error.issues 
            });
          }
          await storage.createUBS(ubsValidacao.data);
          break;
          
        case 'ongs':
          novoRegistro = {
            ...dadosBase,
            responsavel: registroOriginal.responsavel || registroOriginal.gestor || "",
            servicos: registroOriginal.servicos || registroOriginal.especialidades || [],
            site: registroOriginal.site || ""
          };
          const ongValidacao = insertONGSchema.safeParse(novoRegistro);
          if (!ongValidacao.success) {
            return res.status(400).json({ 
              error: "Dados inválidos para ONG", 
              detalhes: ongValidacao.error.issues 
            });
          }
          await storage.createONG(ongValidacao.data);
          break;
          
        case 'equipamentos':
          novoRegistro = {
            ...dadosBase,
            tipo: registroOriginal.tipo || "Equipamento Social",
            capacidade: registroOriginal.capacidade || null,
            servicos: registroOriginal.servicos || registroOriginal.especialidades || []
          };
          const equipValidacao = insertEquipamentoSocialSchema.safeParse(novoRegistro);
          if (!equipValidacao.success) {
            return res.status(400).json({ 
              error: "Dados inválidos para Equipamento Social", 
              detalhes: equipValidacao.error.issues 
            });
          }
          await storage.createEquipamentoSocial(equipValidacao.data);
          break;
      }
      
      // Deletar registro original
      switch (tipoOrigem) {
        case 'ubs':
          await storage.deleteUBS(id);
          break;
        case 'ongs':
          await storage.deleteONG(id);
          break;
        case 'equipamentos':
          await storage.deleteEquipamentoSocial(id);
          break;
      }
      
      res.json({ 
        sucesso: true, 
        mensagem: `Registro reclassificado de ${tipoOrigem} para ${tipoDestino} com sucesso` 
      });
      
    } catch (error) {
      console.error("Erro na reclassificação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ============ ORIENTAÇÕES DE ENCAMINHAMENTO CRUD ============
  
  // Buscar orientações de um paciente
  app.get("/api/pacientes/:pacienteId/orientacoes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const pacienteId = parseInt(req.params.pacienteId);
      const orientacoes = await storage.getOrientacoesByPaciente(pacienteId);
      res.json(orientacoes);
    } catch (error) {
      console.error("Erro ao buscar orientações:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Criar nova orientação
  app.post("/api/orientacoes", auditMiddleware('CREATE', 'orientacoes_encaminhamento'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      // Validação Zod
      const validatedData = insertOrientacaoEncaminhamentoSchema.parse(req.body);
      
      const dadosOrientacao = {
        ...validatedData,
        usuarioId: req.user.id
      };
      
      const orientacao = await storage.createOrientacao(dadosOrientacao);
      res.locals.recordId = orientacao.id;
      res.locals.newValues = orientacao;
      
      res.status(201).json(orientacao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Erro ao criar orientação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Atualizar orientação
  app.put("/api/orientacoes/:id", auditMiddleware('UPDATE', 'orientacoes_encaminhamento'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      // Validação Zod para atualização (parcial)
      const updateSchema = insertOrientacaoEncaminhamentoSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const id = parseInt(req.params.id);
      const orientacaoAtual = await storage.getOrientacao(id);
      
      if (!orientacaoAtual) {
        return res.status(404).json({ error: "Orientação não encontrada" });
      }
      
      res.locals.oldValues = orientacaoAtual;
      
      const orientacaoAtualizada = await storage.updateOrientacao(id, validatedData);
      res.locals.newValues = orientacaoAtualizada;
      
      res.json(orientacaoAtualizada);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Erro ao atualizar orientação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Deletar orientação
  app.delete("/api/orientacoes/:id", auditMiddleware('DELETE', 'orientacoes_encaminhamento'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      const orientacao = await storage.getOrientacao(id);
      
      if (!orientacao) {
        return res.status(404).json({ error: "Orientação não encontrada" });
      }
      
      res.locals.oldValues = orientacao;
      
      await storage.deleteOrientacao(id);
      res.json({ sucesso: true, mensagem: "Orientação deletada com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar orientação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}