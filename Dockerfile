FROM node:20-bullseye-slim as build
WORKDIR /app

# build frontend
COPY web/package.json web/package-lock.json* ./web/
RUN cd web && npm ci
COPY web ./web
RUN cd web && npm run build

FROM node:20-bullseye-slim
WORKDIR /app

# install server deps
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --production

COPY server ./server
COPY --from=build /app/web/dist ./web/dist

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
