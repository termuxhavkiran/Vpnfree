FROM node:20-alpine AS xray-installer

RUN apk add --no-cache unzip curl ca-certificates && \
    curl -L https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip -o /tmp/xray.zip && \
    unzip /tmp/xray.zip -d /usr/local/bin/xray && \
    chmod +x /usr/local/bin/xray/xray && \
    rm /tmp/xray.zip

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN corepack enable bun && bun install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY next.config.ts ./
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
COPY components.json ./
RUN npx prisma generate
RUN corepack enable bun && bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/vpn.db

RUN apk add --no-cache unzip curl ca-certificates ripgrep
COPY --from=xray-installer /usr/local/bin/xray /usr/local/bin/xray

RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 -G app app

COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY scripts/railway/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /app/data && chown -R app:app /app/data

USER app
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
