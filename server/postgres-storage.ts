// PostgreSQL Storage implementation
// Implements IStorage interface with real database operations

import session from "express-session";
import ConnectPgSession from "connect-pg-simple";
import { db, pool } from "./db";
import { 
  users, 
  ubs, 
  ongs, 
  pacientes, 
  equipamentosSociais,
  orientacoesEncaminhamento,
  auditLog,
  geocodingCache,
  type User, 
  type InsertUser,
  type UBS,
  type ONG,
  type Paciente,
  type EquipamentoSocial,
  type OrientacaoEncaminhamento,
  type InsertOrientacaoEncaminhamento,
  type GeocodingCache,
  type InsertGeocodingCache
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { IStorage } from "./storage";

const PgSession = ConnectPgSession(session);

export class PostgreSQLStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSession({
      pool,
      createTableIfMissing: true,
    });
  }

  // ============ USER AUTHENTICATION METHODS ============
  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async getUser(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async createUser(userData: InsertUser & { verificationToken?: string }): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      emailVerified: false,
      verificationToken: userData.verificationToken || null,
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  async verifyUserEmail(token: string): Promise<User | null> {
    const result = await db.update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.verificationToken, token))
      .returning();
    return result[0] || null;
  }

  // ============ UBS CRUD METHODS ============
  async getUBSList(): Promise<UBS[]> {
    return await db.select().from(ubs).where(eq(ubs.ativo, true));
  }

  async getUBS(id: number): Promise<UBS | null> {
    const result = await db.select().from(ubs).where(eq(ubs.id, id)).limit(1);
    return result[0] || null;
  }

  async createUBS(ubsData: Omit<UBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<UBS> {
    const result = await db.insert(ubs).values(ubsData).returning();
    return result[0];
  }

  async updateUBS(id: number, updates: Partial<UBS>): Promise<UBS | null> {
    const result = await db.update(ubs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ubs.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteUBS(id: number): Promise<boolean> {
    // Soft delete - mark as inactive
    const result = await db.update(ubs)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(ubs.id, id))
      .returning();
    return result.length > 0;
  }

  // ============ ONG CRUD METHODS ============
  async getONGList(): Promise<ONG[]> {
    return await db.select().from(ongs).where(eq(ongs.ativo, true));
  }

  async getONG(id: number): Promise<ONG | null> {
    const result = await db.select().from(ongs).where(eq(ongs.id, id)).limit(1);
    return result[0] || null;
  }

  async createONG(ongData: Omit<ONG, 'id' | 'createdAt' | 'updatedAt'>): Promise<ONG> {
    const result = await db.insert(ongs).values(ongData).returning();
    return result[0];
  }

  async updateONG(id: number, updates: Partial<ONG>): Promise<ONG | null> {
    const result = await db.update(ongs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ongs.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteONG(id: number): Promise<boolean> {
    // Soft delete - mark as inactive
    const result = await db.update(ongs)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(ongs.id, id))
      .returning();
    return result.length > 0;
  }

  // ============ PACIENTES CRUD METHODS ============
  async getPacientesList(): Promise<Paciente[]> {
    return await db.select().from(pacientes).where(eq(pacientes.ativo, true));
  }

  async getPaciente(id: number): Promise<Paciente | null> {
    const result = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
    return result[0] || null;
  }

  async createPaciente(pacienteData: Omit<Paciente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Paciente> {
    const result = await db.insert(pacientes).values(pacienteData).returning();
    return result[0];
  }

  async updatePaciente(id: number, updates: Partial<Paciente>): Promise<Paciente | null> {
    const result = await db.update(pacientes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pacientes.id, id))
      .returning();
    return result[0] || null;
  }

  async deletePaciente(id: number): Promise<boolean> {
    // Soft delete - mark as inactive
    const result = await db.update(pacientes)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(pacientes.id, id))
      .returning();
    return result.length > 0;
  }

  // ============ EQUIPAMENTOS SOCIAIS CRUD METHODS ============
  async getEquipamentosSociais(): Promise<EquipamentoSocial[]> {
    return await db.select().from(equipamentosSociais).where(eq(equipamentosSociais.ativo, true));
  }

  async getEquipamentoSocial(id: number): Promise<EquipamentoSocial | null> {
    const result = await db.select().from(equipamentosSociais).where(eq(equipamentosSociais.id, id)).limit(1);
    return result[0] || null;
  }

  async createEquipamentoSocial(equipamentoData: Omit<EquipamentoSocial, 'id' | 'createdAt' | 'updatedAt'>): Promise<EquipamentoSocial> {
    const result = await db.insert(equipamentosSociais).values(equipamentoData).returning();
    return result[0];
  }

  async updateEquipamentoSocial(id: number, updates: Partial<EquipamentoSocial>): Promise<EquipamentoSocial | null> {
    const result = await db.update(equipamentosSociais)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(equipamentosSociais.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteEquipamentoSocial(id: number): Promise<boolean> {
    // Soft delete - mark as inactive
    const result = await db.update(equipamentosSociais)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(equipamentosSociais.id, id))
      .returning();
    return result.length > 0;
  }

  // ============ GEOGRAPHIC QUERIES ============
  async findNearbyUBS(latitude: number, longitude: number, radiusKm: number = 5): Promise<UBS[]> {
    // Using Haversine formula for distance calculation
    const result = await db.select().from(ubs).where(
      sql`${ubs.ativo} = true AND ${ubs.latitude} IS NOT NULL AND ${ubs.longitude} IS NOT NULL
       AND (
         6371 * acos(
           cos(radians(${latitude})) * 
           cos(radians(${ubs.latitude})) * 
           cos(radians(${ubs.longitude}) - radians(${longitude})) + 
           sin(radians(${latitude})) * 
           sin(radians(${ubs.latitude}))
         )
       ) <= ${radiusKm}`
    );
    return result;
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

  // ============ GEOCODING CACHE METHODS ============
  async getGeocodingCache(addressHash: string): Promise<GeocodingCache | null> {
    const result = await db.select().from(geocodingCache).where(eq(geocodingCache.addressHash, addressHash)).limit(1);
    return result[0] || null;
  }

  async setGeocodingCache(cacheData: InsertGeocodingCache): Promise<GeocodingCache> {
    const result = await db.insert(geocodingCache).values(cacheData).returning();
    return result[0];
  }

  async clearOldGeocodingCache(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db.delete(geocodingCache).where(
      sql`${geocodingCache.createdAt} < ${cutoffDate.toISOString()}`
    );
    
    return result.rowCount || 0;
  }

  // ============ UTILITY METHODS ============
  // ============ ORIENTAÇÕES DE ENCAMINHAMENTO METHODS ============
  async getOrientacoesByPaciente(pacienteId: number): Promise<OrientacaoEncaminhamento[]> {
    return await db.select().from(orientacoesEncaminhamento)
      .where(eq(orientacoesEncaminhamento.pacienteId, pacienteId))
      .orderBy(sql`${orientacoesEncaminhamento.createdAt} DESC`);
  }

  async getOrientacao(id: number): Promise<OrientacaoEncaminhamento | null> {
    const result = await db.select().from(orientacoesEncaminhamento)
      .where(eq(orientacoesEncaminhamento.id, id))
      .limit(1);
    return result[0] || null;
  }

  async createOrientacao(orientacaoData: Omit<OrientacaoEncaminhamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrientacaoEncaminhamento> {
    const result = await db.insert(orientacoesEncaminhamento).values(orientacaoData).returning();
    return result[0];
  }

  async updateOrientacao(id: number, updates: Partial<OrientacaoEncaminhamento>): Promise<OrientacaoEncaminhamento | null> {
    const result = await db.update(orientacoesEncaminhamento)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orientacoesEncaminhamento.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteOrientacao(id: number): Promise<boolean> {
    const result = await db.update(orientacoesEncaminhamento)
      .set({ ativo: false, updatedAt: new Date() })
      .where(eq(orientacoesEncaminhamento.id, id));
    return result.rowCount > 0;
  }

  async logAudit(userId: number, action: string, tableName: string, recordId: number, oldValues?: any, newValues?: any) {
    await db.insert(auditLog).values({
      userId,
      action,
      tableName,
      recordId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
    });
  }

  async close() {
    await pool.end();
  }
}
