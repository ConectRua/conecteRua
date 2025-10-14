import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadEnvFile = (filePath, override = false) => {
  if (existsSync(filePath)) {
    config({ path: filePath, override });
  }
};

const projectRoot = __dirname;

[
  { path: resolve(projectRoot, '.env'), override: false },
  { path: resolve(projectRoot, `.env.${process.env.NODE_ENV ?? 'development'}`), override: false },
  { path: resolve(projectRoot, '.env.local'), override: false },
  { path: resolve(projectRoot, 'ambiente/.env'), override: false },
  { path: resolve(projectRoot, 'server/.env'), override: true },
].forEach(({ path, override }) => loadEnvFile(path, override));

const resolveDatabaseUrl = () => {
  const user = process.env.POSTGRES_USER;
  const database = process.env.POSTGRES_DB;
  const hasDiscreteCredentials = Boolean(user && database);

  if (hasDiscreteCredentials) {
    const host = process.env.POSTGRES_HOST ?? 'localhost';
    const port = process.env.POSTGRES_PORT ?? '5432';
    const url = new URL(`postgres://${host}:${port}/${database}`);
    const password = process.env.POSTGRES_PASSWORD;
    const sslMode =
      process.env.POSTGRES_SSL_MODE ??
      process.env.POSTGRES_SSLMODE ??
      process.env.DB_SSLMODE;

    url.username = user;
    if (password) {
      url.password = password;
    }
    if (sslMode) {
      url.searchParams.set('sslmode', sslMode);
    }

    return url.toString();
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error(
    'Set POSTGRES_USER/POSTGRES_DB (recommended) or DATABASE_URL before running Drizzle commands.',
  );
};

export default defineConfig({
  out: "./server/migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
