# Dockerfile para o backend Bun
FROM --platform=linux/amd64 oven/bun:1.0.25
WORKDIR /app

# Copy package files from root
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy shared schema
COPY shared ./shared

# Copy server code
COPY server ./server

EXPOSE 3000

# Run the server from the correct path
CMD ["bun", "run", "server/index.ts"]
