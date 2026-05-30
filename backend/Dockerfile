# ── Build stage ──────────────────────────────────────────
#FROM node:20-alpine AS builder
FROM node:20 as builder

WORKDIR /app

COPY package*.json ./
#RUN npm ci --only=production
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

RUN npx prisma generate
RUN npm run build

# ── Production stage ─────────────────────────────────────
#FROM node:20-alpine AS production
FROM node:20

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
