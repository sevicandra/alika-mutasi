# Stage 1: Builder
FROM node:lts-bullseye AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm install pm2 -g


COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js"]
