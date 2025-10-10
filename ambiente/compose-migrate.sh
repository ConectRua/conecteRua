#!/usr/bin/env bash
#
# Helper script to build/start the docker compose stack and run migrations.
#
# Usage:
#   ./compose-migrate.sh         # start services, run migrations
#   ./compose-migrate.sh --build # rebuild images before starting

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_ARGS=(-f "${ROOT_DIR}/docker-compose.yml")

echo "🚀 Starting geo-samambaia stack..."
if [[ "${1:-}" == "--build" ]]; then
  docker compose "${COMPOSE_ARGS[@]}" up -d --build
else
  docker compose "${COMPOSE_ARGS[@]}" up -d
fi

echo "⏳ Waiting for PostgreSQL health check..."
docker compose "${COMPOSE_ARGS[@]}" wait postgres

echo "🗄️  Running database migrations via Bun..."
docker compose "${COMPOSE_ARGS[@]}" run --rm backend bun run server/migrate.ts

echo "🔄 Restarting backend to pick up latest schema..."
docker compose "${COMPOSE_ARGS[@]}" restart backend

echo "✅ Done. Frontend is available on port 5173, backend on port 3000."
