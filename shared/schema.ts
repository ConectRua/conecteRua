// Database schema for the georeferencing system
// Using Drizzle ORM for PostgreSQL with PostGIS support

import { pgTable, serial, varchar, text, boolean, timestamp, integer, decimal, jsonb, uuid } from "drizzle-orm/pg-core";
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
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
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
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
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
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  telefone: varchar("telefone", { length: 20 }),
  idade: integer("idade"),
  condicoesSaude: text("condicoes_saude").array(),
  ubsMaisProximaId: integer("ubs_mais_proxima_id").references(() => ubs.id),
  distanciaUbs: decimal("distancia_ubs", { precision: 8, scale: 2 }),
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
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
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

// ============ VALIDATION SCHEMAS (for backwards compatibility) ============
export const User = z.object({
  id: z.number(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  emailVerified: z.boolean().default(false),
  verificationToken: z.string().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const loginUserSchema = User.pick({ 
  username: true, 
  password: true 
});

// Export legacy type names for backwards compatibility
export type LoginUser = z.infer<typeof loginUserSchema>;