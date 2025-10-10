# ARQUIVO: server/Dockerfile (Versão Corrigida)

# Dockerfile para back-end Bun
FROM oven/bun:1.0.25
WORKDIR /app

# Copie os arquivos do pacote da raiz do projeto (um nível acima) # <-- MUDANÇA
COPY ../package.json ../bun.lock ./

# Instalar dependências
RUN bun install

# Copiar esquema compartilhado (um nível acima) # <-- MUDANÇA
COPY ../shared ./shared

# Copiar código do servidor (o conteúdo do diretório atual 'server') # <-- MUDANÇA
COPY . .

EXPOSE 3000

# Execute o servidor a partir da raiz do WORKDIR # <-- MUDANÇA
CMD ["bun", "run", "index.ts"]