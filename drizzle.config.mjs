import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis do .env no diretório server
config({ path: resolve('./server/.env') });

export default defineConfig({
  out: "./server/migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});