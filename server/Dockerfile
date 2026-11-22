FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

USER expressjs
EXPOSE 5001

CMD ["node", "dist/index.js"]
