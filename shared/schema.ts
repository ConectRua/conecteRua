// Database schema for the georeferencing system
// Using Drizzle ORM for PostgreSQL with PostGIS support

import { pgTable, serial, varchar, text, boolean, timestamp, integer, decimal, jsonb, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============ USER AUTHENTICATION ============
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(6),
});

export const selectUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  password: z.string(),
  emailVerified: z.boolean(),
  verificationToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = Pick<InsertUser, "username" | "password">;

// ============ UBS (Unidades Básicas de Saúde) ============
export const ubs = pgTable("ubs", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  endereco: text("endereco").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  horarioFuncionamento: text("horario_funcionamento"),
  especialidades: text("especialidades").array(),
  gestor: varchar("gestor", { length: 255 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUBSSchema = z.object({
  nome: z.string().min(1),
  endereco: z.string().min(1),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  horarioFuncionamento: z.string().nullable().optional(),
  especialidades: z.array(z.string()).optional(),
  gestor: z.string().nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export type UBS = typeof ubs.$inferSelect;
export type InsertUBS = z.infer<typeof insertUBSSchema>;

// ============ ONGs ============
export const ongs = pgTable("ongs", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  endereco: text("endereco").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  site: varchar("site", { length: 255 }),
  servicos: text("servicos").array(),
  responsavel: varchar("responsavel", { length: 255 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertONGSchema = z.object({
  nome: z.string().min(1),
  endereco: z.string().min(1),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  site: z.string().nullable().optional(),
  servicos: z.array(z.string()).optional(),
  responsavel: z.string().nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export type ONG = typeof ongs.$inferSelect;
export type InsertONG = z.infer<typeof insertONGSchema>;

// ============ PACIENTES ============
export const pacientes = pgTable("pacientes", {
  id: serial("id").primaryKey(),
  
  // LOCAL DE ATENDIMENTO
  localAtendimento: varchar("local_atendimento", { length: 255 }),
  dataAtendimento: timestamp("data_atendimento"),
  equipe: varchar("equipe", { length: 100 }).default("Samambaia - DF"),
  
  // IDENTIFICAÇÃO COMPLETA
  nome: varchar("nome", { length: 255 }).notNull(),
  nomeSocial: varchar("nome_social", { length: 255 }),
  nomeMae: varchar("nome_mae", { length: 255 }),
  nomePai: varchar("nome_pai", { length: 255 }),
  naturalidade: varchar("naturalidade", { length: 255 }),
  dataNascimento: timestamp("data_nascimento"),
  idade: integer("idade"),
  cnsOuCpf: varchar("cns_ou_cpf", { length: 20 }),
  
  // ENDEREÇO E LOCALIZAÇÃO
  endereco: text("endereco").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  precisaoGeocode: varchar("precisao_geocode", { length: 30 }), // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE, PLACE
  telefone: varchar("telefone", { length: 20 }),
  
  // IDENTIDADE E DEMOGRAFIA
  identidadeGenero: varchar("identidade_genero", { length: 50 }), // Cisgênero, Transgênero, Travesti, Não Binário, Outro
  corRaca: varchar("cor_raca", { length: 50 }), // Preto, Pardo, Branco, Indígena, Amarelo
  orientacaoSexual: varchar("orientacao_sexual", { length: 50 }), // Hétero, Homo, Bissexual, Outro
  
  // SAÚDE MENTAL
  internacao: boolean("internacao"),
  ideacaoSuicida: boolean("ideacao_suicida"),
  tentativaSuicidio: boolean("tentativa_suicidio"),
  
  // SINAIS VITAIS
  pressaoArterial: varchar("pressao_arterial", { length: 20 }),
  frequenciaCardiaca: varchar("frequencia_cardiaca", { length: 10 }),
  fcClassificacao: varchar("fc_classificacao", { length: 20 }), // NORMAL, TAQUICARDIA, BRADICARDIA
  frequenciaRespiratoria: varchar("frequencia_respiratoria", { length: 10 }),
  frClassificacao: varchar("fr_classificacao", { length: 20 }), // EUPNEICO, TAQUIPNEICO, APNEICO
  temperatura: varchar("temperatura", { length: 10 }),
  peso: varchar("peso", { length: 10 }),
  glicemiaCapilar: varchar("glicemia_capilar", { length: 10 }),
  
  // TESTES E EXAMES
  testeGravidez: varchar("teste_gravidez", { length: 20 }), // Positivo, Negativo, Não se aplica
  testeSifilis: boolean("teste_sifilis"),
  testeHepB: boolean("teste_hep_b"),
  testeHepC: boolean("teste_hep_c"),
  testeHIV: boolean("teste_hiv"),
  
  // PADRÃO DE USO DE SUBSTÂNCIAS
  usoAlcool: boolean("uso_alcool"),
  usoMaconha: boolean("uso_maconha"),
  usoCocaina: boolean("uso_cocaina"),
  usoCrack: boolean("uso_crack"),
  usoSinteticos: boolean("uso_sinteticos"),
  usoVolateis: boolean("uso_volateis"),
  
  // HISTÓRICO DOENÇA FAMILIAR
  dmFamiliar: boolean("dm_familiar"),
  haFamiliar: boolean("ha_familiar"),
  avcFamiliar: boolean("avc_familiar"),
  iamFamiliar: boolean("iam_familiar"),
  caFamiliar: boolean("ca_familiar"),
  depressaoFamiliar: boolean("depressao_familiar"),
  ansiedadeFamiliar: boolean("ansiedade_familiar"),
  esquizoFamiliar: boolean("esquizo_familiar"),
  bipolarFamiliar: boolean("bipolar_familiar"),
  alcoolFamiliar: boolean("alcool_familiar"),
  drogasFamiliar: boolean("drogas_familiar"),
  
  // COMORBIDADES ATUAIS
  dm: boolean("dm"),
  ha: boolean("ha"),
  avc: boolean("avc"),
  iam: boolean("iam"),
  ca: boolean("ca"),
  depressao: boolean("depressao"),
  ansiedade: boolean("ansiedade"),
  esquizo: boolean("esquizo"),
  bipolar: boolean("bipolar"),
  alcoolismo: boolean("alcoolismo"),
  asma: boolean("asma"),
  
  // MEDICAÇÕES E SERVIÇOS
  medicacaoEmUso: text("medicacao_em_uso"),
  kitOdonto: boolean("kit_odonto"),
  kitHigiene: boolean("kit_higiene"),
  vacina: boolean("vacina"),
  coletaSangue: boolean("coleta_sangue"),
  admMedicacao: boolean("adm_medicacao"),
  medicacaoAdministrada: text("medicacao_administrada"),
  
  // EXAME FÍSICO DETALHADO
  estadoGeral: varchar("estado_geral", { length: 100 }), // BEG, REG, etc.
  orientacao: varchar("orientacao", { length: 100 }), // Orientado tempo/espaço, desorientado
  consciencia: varchar("consciencia", { length: 100 }), // Vigil, sonolento, obnubilado, estupor, coma
  hidratacao: varchar("hidratacao", { length: 100 }), // Hidratado, desidratado
  nutricao: varchar("nutricao", { length: 100 }), // Nutrido, desnutrido
  coloracao: varchar("coloracao", { length: 100 }), // Normocorado, hipocrômico
  
  // FACIES
  facies: varchar("facies", { length: 20 }), // TÍPICA, ATÍPICA
  faciesDescricao: text("facies_descricao"), // Se ATÍPICA
  
  // PULSOS
  pulsosPresenca: varchar("pulsos_presenca", { length: 20 }), // PRESENTES, AUSENTES
  pulsosSimetria: varchar("pulsos_simetria", { length: 20 }), // SIMÉTRICOS, ASSIMÉTRICOS
  
  // MEMBROS INFERIORES (MMII)
  mmiiPerfusao: varchar("mmii_perfusao", { length: 30 }), // BEM PERFUNDIDOS, POUCO PERFUNDIDOS
  mmiiTvp: varchar("mmii_tvp", { length: 30 }), // COM SINAIS DE TVP, SEM SINAIS DE TVP
  
  // LINFONODOMEGALIAS
  linfonodomegalias: varchar("linfonodomegalias", { length: 10 }), // SEM, COM
  linfonodomegaliasDescricao: text("linfonodomegalias_descricao"), // Se COM
  
  // TVP PANTURRILHAS
  tvpPanturrilhas: varchar("tvp_panturrilhas", { length: 20 }), // EMPASTADAS, NORMAIS
  tvpSinalHomans: varchar("tvp_sinal_homans", { length: 20 }), // POSITIVO, NEGATIVO
  
  // EDEMA
  edemaFacies: boolean("edema_facies"),
  edemaMaos: boolean("edema_maos"),
  edemaPes: boolean("edema_pes"),
  edemaGeneralizado: boolean("edema_generalizado"),
  
  // ABDOME DETALHADO
  abdomenTipo: varchar("abdomen_tipo", { length: 20 }), // GLOBO, ESCAVADO, PENDULAR
  abdomenMassas: varchar("abdomen_massas", { length: 30 }), // PRESENÇA, AUSÊNCIA DE MASSAS
  abdomenHerniaUmbilical: boolean("abdomen_hernia_umbilical"),
  abdomenHerniaInguinal: boolean("abdomen_hernia_inguinal"),
  abdomenRetracoes: boolean("abdomen_retracoes"),
  abdomenCirculacaoColateral: varchar("abdomen_circulacao_colateral", { length: 20 }), // PRESENTE, AUSENTE
  abdomenPeristalse: varchar("abdomen_peristalse", { length: 30 }),
  abdomenLesoesCutaneas: text("abdomen_lesoes_cutaneas"),
  abdomenRuidosHidroaereos: varchar("abdomen_ruidos_hidroaereos", { length: 10 }), // +, -
  abdomenSopros: varchar("abdomen_sopros", { length: 10 }), // +, -
  abdomenDistendido: varchar("abdomen_distendido", { length: 10 }), // +, -
  abdomenDor: varchar("abdomen_dor", { length: 20 }), // DOLOROSO, INDOLOR
  abdomenSinalMurphy: varchar("abdomen_sinal_murphy", { length: 10 }), // +, -
  abdomenSinalBlumberg: varchar("abdomen_sinal_blumberg", { length: 10 }), // +, -
  abdomenSinalGiordano: varchar("abdomen_sinal_giordano", { length: 10 }), // +, -
  abdomenVisceromegalias: varchar("abdomen_visceromegalias", { length: 10 }), // +, -
  
  // CAMPOS EXISTENTES (mantidos para compatibilidade)
  condicoesSaude: text("condicoes_saude").array(),
  ubsMaisProximaId: integer("ubs_mais_proxima_id").references(() => ubs.id),
  distanciaUbs: doublePrecision("distancia_ubs"),
  
  // EVOLUÇÃO E OBSERVAÇÕES
  evolucao: text("evolucao"),
  observacoes: text("observacoes"),
  
  // CONTROLE DE ATENDIMENTOS
  ultimoAtendimento: timestamp("ultimo_atendimento"),
  proximoAtendimento: timestamp("proximo_atendimento"),
  
  // SISTEMA
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPacienteSchema = z.object({
  // LOCAL DE ATENDIMENTO
  localAtendimento: z.string().nullable().optional(),
  dataAtendimento: z.date().nullable().optional(),
  equipe: z.string().nullable().optional(),
  
  // IDENTIFICAÇÃO COMPLETA
  nome: z.string().min(1),
  nomeSocial: z.string().nullable().optional(),
  nomeMae: z.string().nullable().optional(),
  nomePai: z.string().nullable().optional(),
  naturalidade: z.string().nullable().optional(),
  dataNascimento: z.date().nullable().optional(),
  idade: z.number().min(0).nullable().optional(),
  cnsOuCpf: z.string().nullable().optional(),
  
  // ENDEREÇO E LOCALIZAÇÃO
  endereco: z.string().min(1),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  precisaoGeocode: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  
  // IDENTIDADE E DEMOGRAFIA
  identidadeGenero: z.string().nullable().optional(),
  corRaca: z.string().nullable().optional(),
  orientacaoSexual: z.string().nullable().optional(),
  
  // SAÚDE MENTAL
  internacao: z.boolean().nullable().optional(),
  ideacaoSuicida: z.boolean().nullable().optional(),
  tentativaSuicidio: z.boolean().nullable().optional(),
  
  // SINAIS VITAIS
  pressaoArterial: z.string().nullable().optional(),
  frequenciaCardiaca: z.string().nullable().optional(),
  fcClassificacao: z.string().nullable().optional(),
  frequenciaRespiratoria: z.string().nullable().optional(),
  frClassificacao: z.string().nullable().optional(),
  temperatura: z.string().nullable().optional(),
  peso: z.string().nullable().optional(),
  glicemiaCapilar: z.string().nullable().optional(),
  
  // TESTES E EXAMES
  testeGravidez: z.string().nullable().optional(),
  testeSifilis: z.boolean().nullable().optional(),
  testeHepB: z.boolean().nullable().optional(),
  testeHepC: z.boolean().nullable().optional(),
  testeHIV: z.boolean().nullable().optional(),
  
  // PADRÃO DE USO DE SUBSTÂNCIAS
  usoAlcool: z.boolean().nullable().optional(),
  usoMaconha: z.boolean().nullable().optional(),
  usoCocaina: z.boolean().nullable().optional(),
  usoCrack: z.boolean().nullable().optional(),
  usoSinteticos: z.boolean().nullable().optional(),
  usoVolateis: z.boolean().nullable().optional(),
  
  // HISTÓRICO DOENÇA FAMILIAR
  dmFamiliar: z.boolean().nullable().optional(),
  haFamiliar: z.boolean().nullable().optional(),
  avcFamiliar: z.boolean().nullable().optional(),
  iamFamiliar: z.boolean().nullable().optional(),
  caFamiliar: z.boolean().nullable().optional(),
  depressaoFamiliar: z.boolean().nullable().optional(),
  ansiedadeFamiliar: z.boolean().nullable().optional(),
  esquizoFamiliar: z.boolean().nullable().optional(),
  bipolarFamiliar: z.boolean().nullable().optional(),
  alcoolFamiliar: z.boolean().nullable().optional(),
  drogasFamiliar: z.boolean().nullable().optional(),
  
  // COMORBIDADES ATUAIS
  dm: z.boolean().nullable().optional(),
  ha: z.boolean().nullable().optional(),
  avc: z.boolean().nullable().optional(),
  iam: z.boolean().nullable().optional(),
  ca: z.boolean().nullable().optional(),
  depressao: z.boolean().nullable().optional(),
  ansiedade: z.boolean().nullable().optional(),
  esquizo: z.boolean().nullable().optional(),
  bipolar: z.boolean().nullable().optional(),
  alcoolismo: z.boolean().nullable().optional(),
  asma: z.boolean().nullable().optional(),
  
  // MEDICAÇÕES E SERVIÇOS
  medicacaoEmUso: z.string().nullable().optional(),
  kitOdonto: z.boolean().nullable().optional(),
  kitHigiene: z.boolean().nullable().optional(),
  vacina: z.boolean().nullable().optional(),
  coletaSangue: z.boolean().nullable().optional(),
  admMedicacao: z.boolean().nullable().optional(),
  medicacaoAdministrada: z.string().nullable().optional(),
  
  // EXAME FÍSICO DETALHADO
  estadoGeral: z.string().nullable().optional(),
  orientacao: z.string().nullable().optional(),
  consciencia: z.string().nullable().optional(),
  hidratacao: z.string().nullable().optional(),
  nutricao: z.string().nullable().optional(),
  coloracao: z.string().nullable().optional(),
  
  // FACIES
  facies: z.string().nullable().optional(),
  faciesDescricao: z.string().nullable().optional(),
  
  // PULSOS
  pulsosPresenca: z.string().nullable().optional(),
  pulsosSimetria: z.string().nullable().optional(),
  
  // MEMBROS INFERIORES (MMII)
  mmiiPerfusao: z.string().nullable().optional(),
  mmiiTvp: z.string().nullable().optional(),
  
  // LINFONODOMEGALIAS
  linfonodomegalias: z.string().nullable().optional(),
  linfonodomegaliasDescricao: z.string().nullable().optional(),
  
  // TVP PANTURRILHAS
  tvpPanturrilhas: z.string().nullable().optional(),
  tvpSinalHomans: z.string().nullable().optional(),
  
  // EDEMA
  edemaFacies: z.boolean().nullable().optional(),
  edemaMaos: z.boolean().nullable().optional(),
  edemaPes: z.boolean().nullable().optional(),
  edemaGeneralizado: z.boolean().nullable().optional(),
  
  // ABDOME DETALHADO
  abdomenTipo: z.string().nullable().optional(),
  abdomenMassas: z.string().nullable().optional(),
  abdomenHerniaUmbilical: z.boolean().nullable().optional(),
  abdomenHerniaInguinal: z.boolean().nullable().optional(),
  abdomenRetracoes: z.boolean().nullable().optional(),
  abdomenCirculacaoColateral: z.string().nullable().optional(),
  abdomenPeristalse: z.string().nullable().optional(),
  abdomenLesoesCutaneas: z.string().nullable().optional(),
  abdomenRuidosHidroaereos: z.string().nullable().optional(),
  abdomenSopros: z.string().nullable().optional(),
  abdomenDistendido: z.string().nullable().optional(),
  abdomenDor: z.string().nullable().optional(),
  abdomenSinalMurphy: z.string().nullable().optional(),
  abdomenSinalBlumberg: z.string().nullable().optional(),
  abdomenSinalGiordano: z.string().nullable().optional(),
  abdomenVisceromegalias: z.string().nullable().optional(),
  
  // CAMPOS EXISTENTES (mantidos para compatibilidade)
  condicoesSaude: z.array(z.string()).optional(),
  ubsMaisProximaId: z.number().nullable().optional(),
  distanciaUbs: z.number().nullable().optional(),
  
  // EVOLUÇÃO E OBSERVAÇÕES
  evolucao: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  
  // CONTROLE DE ATENDIMENTOS
  ultimoAtendimento: z.coerce.date().nullable().optional(),
  proximoAtendimento: z.coerce.date().nullable().optional(),
  
  // SISTEMA
  ativo: z.boolean().optional().default(true),
});

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = z.infer<typeof insertPacienteSchema>;

// ============ ORIENTAÇÕES DE ENCAMINHAMENTO ============
export const orientacoesEncaminhamento = pgTable("orientacoes_encaminhamento", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").references(() => pacientes.id).notNull(),
  orientacaoAnterior: text("orientacao_anterior"),
  proximaOrientacao: text("proxima_orientacao").notNull(),
  observacoesSeguimento: text("observacoes_seguimento"),
  seguiuOrientacao: boolean("seguiu_orientacao"),
  dataOrientacao: timestamp("data_orientacao").defaultNow(),
  usuarioId: integer("usuario_id").references(() => users.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrientacaoEncaminhamentoSchema = z.object({
  pacienteId: z.number(),
  orientacaoAnterior: z.string().nullable().optional(),
  proximaOrientacao: z.string().min(1),
  observacoesSeguimento: z.string().nullable().optional(),
  seguiuOrientacao: z.boolean().nullable().optional(),
  dataOrientacao: z.date().optional(),
  usuarioId: z.number().nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export type OrientacaoEncaminhamento = typeof orientacoesEncaminhamento.$inferSelect;
export type InsertOrientacaoEncaminhamento = z.infer<typeof insertOrientacaoEncaminhamentoSchema>;

// ============ EQUIPAMENTOS SOCIAIS ============
export const equipamentosSociais = pgTable("equipamentos_sociais", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 100 }).notNull(),
  endereco: text("endereco").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  horarioFuncionamento: text("horario_funcionamento"),
  servicos: text("servicos").array(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEquipamentoSocialSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  endereco: z.string().min(1),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  horarioFuncionamento: z.string().nullable().optional(),
  servicos: z.array(z.string()).optional(),
  ativo: z.boolean().optional().default(true),
});

export type EquipamentoSocial = typeof equipamentosSociais.$inferSelect;
export type InsertEquipamentoSocial = z.infer<typeof insertEquipamentoSocialSchema>;

// ============ AUDIT LOG ============
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  tableName: varchar("table_name", { length: 50 }).notNull(),
  recordId: integer("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ GEOCODING CACHE ============
export const geocodingCache = pgTable("geocoding_cache", {
  id: serial("id").primaryKey(),
  addressHash: varchar("address_hash", { length: 64 }).unique().notNull(),
  address: text("address").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  source: varchar("source", { length: 20 }).notNull(), // 'nominatim', 'viacep', 'error'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeocodingCacheSchema = z.object({
  addressHash: z.string().min(1),
  address: z.string().min(1),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  source: z.string().min(1),
  errorMessage: z.string().nullable().optional(),
});

export type GeocodingCache = typeof geocodingCache.$inferSelect;
export type InsertGeocodingCache = z.infer<typeof insertGeocodingCacheSchema>;

// ============ RELATIONS ============
export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLog),
}));

export const ubsRelations = relations(ubs, ({ many }) => ({
  pacientes: many(pacientes),
}));

export const pacientesRelations = relations(pacientes, ({ one }) => ({
  ubsMaisProxima: one(ubs, {
    fields: [pacientes.ubsMaisProximaId],
    references: [ubs.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// ============ LOGIN SCHEMA ============
export const loginUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6)
});