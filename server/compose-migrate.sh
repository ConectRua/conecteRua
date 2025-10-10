#!/usr/bin/env bash

set -euo pipefail

# Always run migrations directly; this script is intended for container usage.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "🗄️  Running database migrations via Bun..."
bun run server/migrate.ts
echo "✅ Migrations complete."
