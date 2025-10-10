iimport { defineConfig, loadEnv } from "vite"; // <-- A ÚNICA MUDANÇA É AQUI
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "0.0.0.0",
      port: 5000,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        clientPort: 443,
      },
      allowedHosts: [
        "f4188f4d-b026-473e-945a-5a0b13d4deff-00-cvhn23q3ysq7.janeway.replit.dev",
        ".replit.dev",
        ".repl.co",
        "localhost",
      ],
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});