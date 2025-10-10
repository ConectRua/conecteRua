# ARQUIVO: server/Dockerfile (Versão final correta)

# Dockerfile para o backend Bun
FROM oven/bun:1.0.25
WORKDIR /app

# Copia os arquivos da raiz, pois o contexto AGORA é a raiz
COPY package.json bun.lock ./

# Instalar dependências
RUN bun install

# Copia a pasta shared da raiz
COPY shared ./shared

# Copia apenas o código do servidor para dentro de uma pasta 'server'
COPY server ./server

EXPOSE 3000

# Executa o servidor a partir do caminho correto dentro do container
CMD ["bun", "run", "server/index.ts"]