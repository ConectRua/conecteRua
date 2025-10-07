// Storage interface for authentication and data management
// Based on blueprint:javascript_auth_all_persistance integration

import session from "express-session";
import createMemoryStore from "memorystore";
import { User, InsertUser, UBS, ONG, Paciente, EquipamentoSocial, GeocodingCache, InsertGeocodingCache, OrientacaoEncaminhamento, InsertOrientacaoEncaminhamento } from "../shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User authentication methods
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  createUser(user: InsertUser & { verificationToken?: string }): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | null>;
  verifyUserEmail(token: string): Promise<User | null>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // UBS CRUD methods
  getUBSList(): Promise<UBS[]>;
  getUBS(id: number): Promise<UBS | null>;
  createUBS(ubs: Omit<UBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<UBS>;
  updateUBS(id: number, updates: Partial<UBS>): Promise<UBS | null>;
  deleteUBS(id: number): Promise<boolean>;
  
  // ONG CRUD methods
  getONGList(): Promise<ONG[]>;
  getONG(id: number): Promise<ONG | null>;
  createONG(ong: Omit<ONG, 'id' | 'createdAt' | 'updatedAt'>): Promise<ONG>;
  updateONG(id: number, updates: Partial<ONG>): Promise<ONG | null>;
  deleteONG(id: number): Promise<boolean>;
  
  // Pacientes CRUD methods
  getPacientesList(): Promise<Paciente[]>;
  getPaciente(id: number): Promise<Paciente | null>;
  createPaciente(paciente: Omit<Paciente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Paciente>;
  updatePaciente(id: number, updates: Partial<Paciente>): Promise<Paciente | null>;
  deletePaciente(id: number): Promise<boolean>;
  deletePacientes(ids: number[]): Promise<{ success: number; failed: number }>;
  
  // Equipamentos Sociais CRUD methods
  getEquipamentosSociais(): Promise<EquipamentoSocial[]>;
  getEquipamentoSocial(id: number): Promise<EquipamentoSocial | null>;
  createEquipamentoSocial(equipamento: Omit<EquipamentoSocial, 'id' | 'createdAt' | 'updatedAt'>): Promise<EquipamentoSocial>;
  updateEquipamentoSocial(id: number, updates: Partial<EquipamentoSocial>): Promise<EquipamentoSocial | null>;
  deleteEquipamentoSocial(id: number): Promise<boolean>;
  
  // Geographic queries
  findNearbyUBS(latitude: number, longitude: number, radiusKm?: number): Promise<UBS[]>;
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
  
  // Geocoding cache methods
  getGeocodingCache(addressHash: string): Promise<GeocodingCache | null>;
  setGeocodingCache(cache: InsertGeocodingCache): Promise<GeocodingCache>;
  clearOldGeocodingCache(daysOld?: number): Promise<number>;
  
  // Orientações de Encaminhamento CRUD methods
  getOrientacoesByPaciente(pacienteId: number): Promise<OrientacaoEncaminhamento[]>;
  getOrientacao(id: number): Promise<OrientacaoEncaminhamento | null>;
  createOrientacao(orientacao: Omit<OrientacaoEncaminhamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrientacaoEncaminhamento>;
  updateOrientacao(id: number, updates: Partial<OrientacaoEncaminhamento>): Promise<OrientacaoEncaminhamento | null>;
  deleteOrientacao(id: number): Promise<boolean>;
  
  // Métodos de verificação de duplicatas
  findPacienteByCnsOuCpf(cnsOuCpf: string): Promise<Paciente | null>;
  findUBSByNome(nome: string): Promise<UBS | null>;
  findONGByNome(nome: string): Promise<ONG | null>;
  findEquipamentoSocialByNome(nome: string): Promise<EquipamentoSocial | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private usersByUsername: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private usersByToken: Map<string, User> = new Map();
  private nextUserId = 1;
  
  // Mock data storage (keeping existing structure)
  private ubsList: UBS[] = [];
  private ongsList: ONG[] = [];
  private pacientesList: Paciente[] = [];
  private equipamentosSociais: EquipamentoSocial[] = [];
  private orientacoesList: OrientacaoEncaminhamento[] = [];
  private nextOrientacaoId = 1;
  
  // Geocoding cache storage
  private geocodingCache: Map<string, GeocodingCache> = new Map();
  private nextCacheId = 1;

  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with mock data
    this.initializeMockData();
  }

  // User authentication methods
  async getUserByUsername(username: string): Promise<User | null> {
    return this.usersByUsername.get(username) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email) || null;
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async createUser(userData: InsertUser & { verificationToken?: string }): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      ...userData,
      emailVerified: false,
      verificationToken: userData.verificationToken || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
    this.usersByEmail.set(user.email, user);
    
    if (user.verificationToken) {
      this.usersByToken.set(user.verificationToken, user);
    }

    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    
    // Update all indexes if username or email changed
    if (updates.username && updates.username !== user.username) {
      this.usersByUsername.delete(user.username);
      this.usersByUsername.set(updates.username, updatedUser);
    }
    
    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email);
      this.usersByEmail.set(updates.email, updatedUser);
    }

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUserEmail(token: string): Promise<User | null> {
    const user = this.usersByToken.get(token);
    if (!user) return null;

    const verifiedUser = await this.updateUser(user.id, {
      emailVerified: true,
      verificationToken: null,
    });

    if (verifiedUser) {
      this.usersByToken.delete(token);
    }

    return verifiedUser;
  }

  // Application data methods (keeping existing mock data structure)
  private initializeMockData() {
    // UBS data
    this.ubsList = [
      {
        id: 1,
        nome: "UBS Samambaia Norte",
        endereco: "QS 101, Conjunto A, Lote 1, Samambaia Norte",
        cep: "72300-101",
        telefone: "(61) 3901-2345",
        especialidades: ["Clínica Geral", "Pediatria", "Ginecologia", "Odontologia"],
        horarioFuncionamento: "07:00 - 17:00",
        latitude: -15.8759,
        longitude: -48.0438,
        email: "ubs.samambaia@df.gov.br",
        gestor: "Dr. João Silva",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        nome: "UBS Recanto das Emas Sul",
        endereco: "Quadra 805, Área Especial, Recanto das Emas",
        cep: "72610-805",
        telefone: "(61) 3901-3456",
        especialidades: ["Clínica Geral", "Enfermagem", "Psicologia"],
        horarioFuncionamento: "07:00 - 17:00",
        latitude: -15.9042,
        longitude: -48.0661,
        email: "ubs.recanto@df.gov.br",
        gestor: "Dra. Maria Santos",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        nome: "Centro de Saúde Água Quente",
        endereco: "Rua 25 Norte, Lote 2, Água Quente",
        cep: "71906-050",
        telefone: "(61) 3901-4567",
        especialidades: ["Clínica Geral", "Cardiologia", "Dermatologia", "Ortopedia"],
        horarioFuncionamento: "06:00 - 18:00",
        latitude: -15.8342,
        longitude: -48.0262,
        email: "cs.aguasclaras@df.gov.br",
        gestor: "Dr. Carlos Lima",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        nome: "UBS Samambaia Sul",
        endereco: "QS 303, Conjunto 1, Samambaia Sul",
        cep: "72302-303",
        telefone: "(61) 3901-5678",
        especialidades: ["Clínica Geral", "Pediatria", "Enfermagem"],
        horarioFuncionamento: "07:00 - 17:00",
        latitude: -15.8859,
        longitude: -48.0538,
        email: "ubs.samambaiasul@df.gov.br",
        gestor: "Dra. Ana Costa",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        nome: "Policlínica Recanto das Emas",
        endereco: "Quadra 603, Área Especial, Recanto das Emas",
        cep: "72610-603",
        telefone: "(61) 3901-6789",
        especialidades: ["Clínica Geral", "Especialidades", "Exames", "Urgência"],
        horarioFuncionamento: "24 horas",
        latitude: -15.9142,
        longitude: -48.0561,
        email: "policlinica.recanto@df.gov.br",
        gestor: "Dr. Pedro Oliveira",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // ONGs data  
    this.ongsList = [
      {
        id: 1,
        nome: "Instituto Assistência Solidária",
        endereco: "QS 102, Conjunto B, Samambaia Norte",
        cep: "72300-102",
        telefone: "(61) 3234-5678",
        servicos: ["Distribuição de Alimentos", "Acompanhamento Psicológico", "Cursos Profissionalizantes"],
        responsavel: "Maria Santos Silva",
        latitude: -15.8759,
        longitude: -48.0338,
        email: "contato@assistenciasolidaria.org",
        site: "www.assistenciasolidaria.org",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        nome: "Centro Comunitário Esperança",
        endereco: "Quadra 806, Lote 10, Recanto das Emas",
        cep: "72610-806",
        telefone: "(61) 3345-6789",
        servicos: ["Abrigo Temporário", "Assistência Jurídica", "Reintegração Social"],
        responsavel: "João Carlos Oliveira",
        latitude: -15.9042,
        longitude: -48.0561,
        email: "contato@centroesperanca.org",
        site: "www.centroesperanca.org",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Pacientes data
    this.pacientesList = [
      {
        id: 1,
        nome: "Ana Paula Costa",
        endereco: "QS 101, Casa 15, Samambaia Norte",
        cep: "72300-101",
        telefone: "(61) 99876-5432",
        idade: 35,
        condicoesSaude: ["Hipertensão"],
        ubsMaisProximaId: 1,
        distanciaUbs: 0.5,
        latitude: -15.8759,
        longitude: -48.0438,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        nome: "Carlos Eduardo Santos",
        endereco: "Quadra 805, Casa 23, Recanto das Emas",
        cep: "72610-805",
        telefone: "(61) 98765-4321",
        idade: 42,
        condicoesSaude: ["Diabetes"],
        ubsMaisProximaId: 2,
        distanciaUbs: 0.3,
        latitude: -15.9042,
        longitude: -48.0661,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        nome: "Fernanda Lima Souza",
        endereco: "Rua 25 Norte, Casa 8, Água Quente",
        cep: "71906-050",
        telefone: "(61) 97654-3210",
        idade: 28,
        condicoesSaude: ["Asma"],
        ubsMaisProximaId: 3,
        distanciaUbs: 0.8,
        latitude: -15.8342,
        longitude: -48.0262,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Equipamentos Sociais data
    this.equipamentosSociais = [
      {
        id: 1,
        nome: "CRAS Samambaia Norte",
        tipo: "CRAS",
        endereco: "QS 101, Área Especial, Samambaia Norte",
        cep: "72300-101",
        telefone: "(61) 3901-1111",
        email: "cras.samambaia@df.gov.br",
        latitude: -15.8759,
        longitude: -48.0338,
        horarioFuncionamento: "08:00 - 17:00",
        servicos: ["Assistência Social", "Programas Sociais"],
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        nome: "CAPS AD Recanto das Emas",
        tipo: "CAPS",
        endereco: "Quadra 805, Área Especial, Recanto das Emas",
        cep: "72610-805",
        telefone: "(61) 3901-2222",
        email: "caps.recanto@df.gov.br",
        latitude: -15.9042,
        longitude: -48.0561,
        horarioFuncionamento: "24 horas",
        servicos: ["Saúde Mental", "Dependência Química"],
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        nome: "Conselho Tutelar Água Quente",
        tipo: "Conselho Tutelar",
        endereco: "Rua 25 Norte, Lote 5, Água Quente",
        cep: "71906-050",
        telefone: "(61) 3901-3333",
        email: "ct.aguasclaras@df.gov.br",
        latitude: -15.8342,
        longitude: -48.0162,
        horarioFuncionamento: "08:00 - 18:00",
        servicos: ["Proteção à Criança e Adolescente"],
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async getUBSList(): Promise<UBS[]> {
    return this.ubsList;
  }

  async getONGList(): Promise<ONG[]> {
    return this.ongsList;
  }

  async getPacientesList(): Promise<Paciente[]> {
    return this.pacientesList;
  }

  async getEquipamentosSociais(): Promise<EquipamentoSocial[]> {
    return this.equipamentosSociais;
  }
  
  // UBS CRUD methods
  async getUBS(id: number): Promise<UBS | null> {
    return this.ubsList.find(ubs => ubs.id === id) || null;
  }
  
  async createUBS(ubsData: Omit<UBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<UBS> {
    const ubs: UBS = {
      id: Math.max(...this.ubsList.map(u => u.id), 0) + 1,
      ...ubsData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ubsList.push(ubs);
    return ubs;
  }
  
  async updateUBS(id: number, updates: Partial<UBS>): Promise<UBS | null> {
    const index = this.ubsList.findIndex(ubs => ubs.id === id);
    if (index === -1) return null;
    
    this.ubsList[index] = { ...this.ubsList[index], ...updates, updatedAt: new Date() };
    return this.ubsList[index];
  }
  
  async deleteUBS(id: number): Promise<boolean> {
    const index = this.ubsList.findIndex(ubs => ubs.id === id);
    if (index === -1) return false;
    
    this.ubsList.splice(index, 1);
    return true;
  }
  
  // ONG CRUD methods
  async getONG(id: number): Promise<ONG | null> {
    return this.ongsList.find(ong => ong.id === id) || null;
  }
  
  async createONG(ongData: Omit<ONG, 'id' | 'createdAt' | 'updatedAt'>): Promise<ONG> {
    const ong: ONG = {
      id: Math.max(...this.ongsList.map(o => o.id), 0) + 1,
      ...ongData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ongsList.push(ong);
    return ong;
  }
  
  async updateONG(id: number, updates: Partial<ONG>): Promise<ONG | null> {
    const index = this.ongsList.findIndex(ong => ong.id === id);
    if (index === -1) return null;
    
    this.ongsList[index] = { ...this.ongsList[index], ...updates, updatedAt: new Date() };
    return this.ongsList[index];
  }
  
  async deleteONG(id: number): Promise<boolean> {
    const index = this.ongsList.findIndex(ong => ong.id === id);
    if (index === -1) return false;
    
    this.ongsList.splice(index, 1);
    return true;
  }
  
  // Pacientes CRUD methods
  async getPaciente(id: number): Promise<Paciente | null> {
    return this.pacientesList.find(p => p.id === id) || null;
  }
  
  async createPaciente(pacienteData: Omit<Paciente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Paciente> {
    const paciente: Paciente = {
      id: Math.max(...this.pacientesList.map(p => p.id), 0) + 1,
      ...pacienteData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pacientesList.push(paciente);
    return paciente;
  }
  
  async updatePaciente(id: number, updates: Partial<Paciente>): Promise<Paciente | null> {
    const index = this.pacientesList.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.pacientesList[index] = { ...this.pacientesList[index], ...updates, updatedAt: new Date() };
    return this.pacientesList[index];
  }
  
  async deletePaciente(id: number): Promise<boolean> {
    const index = this.pacientesList.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.pacientesList.splice(index, 1);
    return true;
  }

  async deletePacientes(ids: number[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const id of ids) {
      const deleted = await this.deletePaciente(id);
      if (deleted) {
        success++;
      } else {
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  // Equipamentos Sociais CRUD methods
  async getEquipamentoSocial(id: number): Promise<EquipamentoSocial | null> {
    return this.equipamentosSociais.find(e => e.id === id) || null;
  }
  
  async createEquipamentoSocial(equipamentoData: Omit<EquipamentoSocial, 'id' | 'createdAt' | 'updatedAt'>): Promise<EquipamentoSocial> {
    const equipamento: EquipamentoSocial = {
      id: Math.max(...this.equipamentosSociais.map(e => e.id), 0) + 1,
      ...equipamentoData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.equipamentosSociais.push(equipamento);
    return equipamento;
  }
  
  async updateEquipamentoSocial(id: number, updates: Partial<EquipamentoSocial>): Promise<EquipamentoSocial | null> {
    const index = this.equipamentosSociais.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.equipamentosSociais[index] = { ...this.equipamentosSociais[index], ...updates, updatedAt: new Date() };
    return this.equipamentosSociais[index];
  }
  
  async deleteEquipamentoSocial(id: number): Promise<boolean> {
    const index = this.equipamentosSociais.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    this.equipamentosSociais.splice(index, 1);
    return true;
  }
  
  // Geographic queries
  async findNearbyUBS(latitude: number, longitude: number, radiusKm: number = 5): Promise<UBS[]> {
    return this.ubsList.filter(ubs => {
      if (!ubs.latitude || !ubs.longitude) return false;
      const distance = this.calculateDistance(latitude, longitude, ubs.latitude, ubs.longitude);
      return distance <= radiusKm;
    });
  }
  
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // Geocoding cache methods
  async getGeocodingCache(addressHash: string): Promise<GeocodingCache | null> {
    return this.geocodingCache.get(addressHash) || null;
  }
  
  async setGeocodingCache(cacheData: InsertGeocodingCache): Promise<GeocodingCache> {
    const cache: GeocodingCache = {
      id: this.nextCacheId++,
      ...cacheData,
      createdAt: new Date(),
    };
    this.geocodingCache.set(cacheData.addressHash, cache);
    return cache;
  }
  
  async clearOldGeocodingCache(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    for (const [hash, cache] of this.geocodingCache) {
      if (cache.createdAt && cache.createdAt < cutoffDate) {
        this.geocodingCache.delete(hash);
        deletedCount++;
      }
    }
    return deletedCount;
  }
  
  // Orientações de Encaminhamento methods
  async getOrientacoesByPaciente(pacienteId: number): Promise<OrientacaoEncaminhamento[]> {
    return this.orientacoesList.filter(o => o.pacienteId === pacienteId && o.ativo);
  }
  
  async getOrientacao(id: number): Promise<OrientacaoEncaminhamento | null> {
    return this.orientacoesList.find(o => o.id === id && o.ativo) || null;
  }
  
  async createOrientacao(orientacaoData: Omit<OrientacaoEncaminhamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrientacaoEncaminhamento> {
    const orientacao: OrientacaoEncaminhamento = {
      id: this.nextOrientacaoId++,
      ...orientacaoData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orientacoesList.push(orientacao);
    return orientacao;
  }
  
  async updateOrientacao(id: number, updates: Partial<OrientacaoEncaminhamento>): Promise<OrientacaoEncaminhamento | null> {
    const index = this.orientacoesList.findIndex(o => o.id === id && o.ativo);
    if (index === -1) return null;
    
    const orientacao = {
      ...this.orientacoesList[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.orientacoesList[index] = orientacao;
    return orientacao;
  }
  
  async deleteOrientacao(id: number): Promise<boolean> {
    const index = this.orientacoesList.findIndex(o => o.id === id && o.ativo);
    if (index === -1) return false;
    
    this.orientacoesList[index] = {
      ...this.orientacoesList[index],
      ativo: false,
      updatedAt: new Date(),
    };
    return true;
  }

  // Métodos de verificação de duplicatas
  async findPacienteByCnsOuCpf(cnsOuCpf: string): Promise<Paciente | null> {
    return this.pacientesList.find(p => p.cnsOuCpf === cnsOuCpf) || null;
  }

  async findUBSByNome(nome: string): Promise<UBS | null> {
    return this.ubsList.find(u => u.nome.toLowerCase() === nome.toLowerCase()) || null;
  }

  async findONGByNome(nome: string): Promise<ONG | null> {
    return this.ongsList.find(o => o.nome.toLowerCase() === nome.toLowerCase()) || null;
  }

  async findEquipamentoSocialByNome(nome: string): Promise<EquipamentoSocial | null> {
    return this.equipamentosSociais.find(e => e.nome.toLowerCase() === nome.toLowerCase()) || null;
  }
}

// Import PostgreSQLStorage
import { PostgreSQLStorage } from "./postgres-storage";

// Configure storage based on environment
// Use PostgreSQL in production, MemStorage in development for testing
export const storage: IStorage = process.env.NODE_ENV === 'production' 
  ? new PostgreSQLStorage()
  : new PostgreSQLStorage(); // Using PostgreSQL in all environments now

// Keep MemStorage available for testing purposes
export const memStorage = new MemStorage();