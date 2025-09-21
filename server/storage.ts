// Storage interface for authentication and data management
// Based on blueprint:javascript_auth_all_persistance integration

import session from "express-session";
import createMemoryStore from "memorystore";
import { User, InsertUser, UBS, ONG, Paciente, EquipamentoSocial } from "../shared/schema";

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
  sessionStore: session.SessionStore;
  
  // Application data methods (keeping existing structure)
  getUBSList(): Promise<UBS[]>;
  getONGList(): Promise<ONG[]>;
  getPacientesList(): Promise<Paciente[]>;
  getEquipamentosSociais(): Promise<EquipamentoSocial[]>;
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

  public sessionStore: session.SessionStore;

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
        tipo: "UBS",
        especialidades: ["Clínica Geral", "Pediatria", "Ginecologia", "Odontologia"],
        horarioFuncionamento: "07:00 - 17:00",
        latitude: -15.8759,
        longitude: -48.0438,
        ativo: true,
      },
      {
        id: 2,
        nome: "UBS Recanto das Emas Sul",
        endereco: "Quadra 805, Área Especial, Recanto das Emas",
        cep: "72610-805",
        telefone: "(61) 3901-3456",
        tipo: "UBS",
        especialidades: ["Clínica Geral", "Enfermagem", "Psicologia"],
        horarioFuncionamento: "07:00 - 17:00",
        latitude: -15.9042,
        longitude: -48.0661,
        ativo: true,
      },
      {
        id: 3,
        nome: "Centro de Saúde Águas Claras",
        endereco: "Rua 25 Norte, Lote 2, Águas Claras",
        cep: "71906-050",
        telefone: "(61) 3901-4567",
        tipo: "Centro de Saúde",
        especialidades: ["Clínica Geral", "Cardiologia", "Dermatologia", "Ortopedia"],
        horarioFuncionamento: "06:00 - 18:00",
        latitude: -15.8342,
        longitude: -48.0262,
        ativo: true,
      },
      {
        id: 4,
        nome: "UBS Samambaia Sul",
        endereco: "QS 303, Conjunto 1, Samambaia Sul",
        cep: "72302-303",
        telefone: "(61) 3901-5678",
        tipo: "UBS",
        especialidades: ["Clínica Geral", "Pediatria", "Enfermagem"],
        horarioFuncionamento: "07:00 - 17:00",
        latitude: -15.8859,
        longitude: -48.0538,
        ativo: true,
      },
      {
        id: 5,
        nome: "Policlínica Recanto das Emas",
        endereco: "Quadra 603, Área Especial, Recanto das Emas",
        cep: "72610-603",
        telefone: "(61) 3901-6789",
        tipo: "Policlínica",
        especialidades: ["Clínica Geral", "Especialidades", "Exames", "Urgência"],
        horarioFuncionamento: "24 horas",
        latitude: -15.9142,
        longitude: -48.0561,
        ativo: true,
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
        tipo: "ONG",
        servicos: ["Distribuição de Alimentos", "Acompanhamento Psicológico", "Cursos Profissionalizantes"],
        responsavel: "Maria Santos Silva",
        latitude: -15.8759,
        longitude: -48.0338,
        ativo: true,
      },
      {
        id: 2,
        nome: "Centro Comunitário Esperança",
        endereco: "Quadra 806, Lote 10, Recanto das Emas",
        cep: "72610-806",
        telefone: "(61) 3345-6789",
        tipo: "Centro Comunitário",
        servicos: ["Abrigo Temporário", "Assistência Jurídica", "Reintegração Social"],
        responsavel: "João Carlos Oliveira",
        latitude: -15.9042,
        longitude: -48.0561,
        ativo: true,
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
        ubsVinculada: 1,
        latitude: -15.8759,
        longitude: -48.0438,
        ativo: true,
      },
      {
        id: 2,
        nome: "Carlos Eduardo Santos",
        endereco: "Quadra 805, Casa 23, Recanto das Emas",
        cep: "72610-805",
        telefone: "(61) 98765-4321",
        ubsVinculada: 2,
        latitude: -15.9042,
        longitude: -48.0661,
        ativo: true,
      },
      {
        id: 3,
        nome: "Fernanda Lima Souza",
        endereco: "Rua 25 Norte, Casa 8, Águas Claras",
        cep: "71906-050",
        telefone: "(61) 97654-3210",
        ubsVinculada: 3,
        latitude: -15.8342,
        longitude: -48.0262,
        ativo: true,
      },
    ];

    // Equipamentos Sociais data
    this.equipamentosSociais = [
      {
        id: 1,
        nome: "CRAS Samambaia Norte",
        tipo: "CRAS",
        endereco: "QS 101, Área Especial, Samambaia Norte",
        telefone: "(61) 3901-1111",
        latitude: -15.8759,
        longitude: -48.0338,
        ativo: true,
      },
      {
        id: 2,
        nome: "CAPS AD Recanto das Emas",
        tipo: "CAPS",
        endereco: "Quadra 805, Área Especial, Recanto das Emas",
        telefone: "(61) 3901-2222",
        latitude: -15.9042,
        longitude: -48.0561,
        ativo: true,
      },
      {
        id: 3,
        nome: "Conselho Tutelar Águas Claras",
        tipo: "Conselho Tutelar",
        endereco: "Rua 25 Norte, Lote 5, Águas Claras",
        telefone: "(61) 3901-3333",
        latitude: -15.8342,
        longitude: -48.0162,
        ativo: true,
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
}

export const storage = new MemStorage();