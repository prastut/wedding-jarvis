FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY admin-panel ./admin-panel

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/admin-panel/dist ./admin-panel/dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
