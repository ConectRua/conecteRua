// Database schema for the georeferencing system
// Based on blueprint:javascript_auth_all_persistance integration

import { z } from "zod";

// User authentication schema
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

export const insertUserSchema = User.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  emailVerified: true,
  verificationToken: true 
});

export const loginUserSchema = User.pick({ 
  username: true, 
  password: true 
});

export type User = z.infer<typeof User>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// UBS (Unidade Básica de Saúde)
export const UBS = z.object({
  id: z.number(),
  nome: z.string(),
  endereco: z.string(),
  cep: z.string(),
  telefone: z.string(),
  tipo: z.string(),
  especialidades: z.array(z.string()),
  horarioFuncionamento: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  ativo: z.boolean().default(true),
});

export type UBS = z.infer<typeof UBS>;

// ONG/Instituição
export const ONG = z.object({
  id: z.number(),
  nome: z.string(),
  endereco: z.string(),
  cep: z.string(),
  telefone: z.string(),
  tipo: z.string(),
  servicos: z.array(z.string()),
  responsavel: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  ativo: z.boolean().default(true),
});

export type ONG = z.infer<typeof ONG>;

// Paciente
export const Paciente = z.object({
  id: z.number(),
  nome: z.string(),
  endereco: z.string(),
  cep: z.string(),
  telefone: z.string(),
  ubsVinculada: z.number().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  ativo: z.boolean().default(true),
});

export type Paciente = z.infer<typeof Paciente>;

// Equipamento Social
export const EquipamentoSocial = z.object({
  id: z.number(),
  nome: z.string(),
  tipo: z.string(),
  endereco: z.string(),
  telefone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  ativo: z.boolean().default(true),
});

export type EquipamentoSocial = z.infer<typeof EquipamentoSocial>;