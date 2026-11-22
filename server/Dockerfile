FROM node:22-alpine AS builder
WORKDIR /app

# 1. Install all dependencies and generate Prisma Client
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps
RUN npx prisma generate

# 2. Build TypeScript source code
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# 3. Prune dev dependencies, keeping production packages and generated Prisma client
RUN npm prune --omit=dev --ignore-scripts

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Add OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy runtime assets from builder
COPY package.json ./
COPY prisma ./prisma/
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist

USER expressjs
EXPOSE 5001

CMD ["node", "dist/index.js"]
