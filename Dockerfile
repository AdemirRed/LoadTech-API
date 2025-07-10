# Dockerfile para produção
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    postgresql-client \
    curl \
    dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Estágio de dependências
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Estágio de build
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build 2>/dev/null || echo "No build script found"

# Estágio de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copiar usuário
COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group

# Copiar dependências
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Criar diretórios necessários
RUN mkdir -p uploads logs && \
    chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
