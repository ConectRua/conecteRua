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
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  verificationToken: true,
});

export const selectUserSchema = createSelectSchema(users);

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

export const insertUBSSchema = createInsertSchema(ubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUBSSchema = createSelectSchema(ubs);

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

export const insertONGSchema = createInsertSchema(ongs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectONGSchema = createSelectSchema(ongs);

export type ONG = typeof ongs.$inferSelect;
export type InsertONG = z.infer<typeof insertONGSchema>;

// ============ PACIENTES ============
export const pacientes = pgTable("pacientes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  endereco: text("endereco").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  telefone: varchar("telefone", { length: 20 }),
  idade: integer("idade"),
  condicoesSaude: text("condicoes_saude").array(),
  ubsMaisProximaId: integer("ubs_mais_proxima_id").references(() => ubs.id),
  distanciaUbs: doublePrecision("distancia_ubs"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPacienteSchema = createInsertSchema(pacientes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectPacienteSchema = createSelectSchema(pacientes);

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = z.infer<typeof insertPacienteSchema>;

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

export const insertEquipamentoSocialSchema = createInsertSchema(equipamentosSociais).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectEquipamentoSocialSchema = createSelectSchema(equipamentosSociais);

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

export const insertGeocodingCacheSchema = createInsertSchema(geocodingCache).omit({
  id: true,
  createdAt: true,
});

export const selectGeocodingCacheSchema = createSelectSchema(geocodingCache);

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