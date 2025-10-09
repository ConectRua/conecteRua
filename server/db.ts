import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar dotenv - arquivo está no mesmo diretório
config({ path: resolve(__dirname, '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
      'DATABASE_URL must be set. Did you forget to provision a database?',
  );
}

// Configurar o pool de conexões do PostgreSQL
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });