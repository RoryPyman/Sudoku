# ── Stage 1: Build the Vite frontend ─────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source and built frontend
COPY server/ ./server/
COPY --from=frontend-build /app/dist ./dist

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server/server.js"]
