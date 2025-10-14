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
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER;
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const database = process.env.POSTGRES_DB;

  if (!user || !database) {
    throw new Error(
      'Set DATABASE_URL or POSTGRES_USER/POSTGRES_DB before running Drizzle commands.',
    );
  }

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
};

export default defineConfig({
  out: "./server/migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
