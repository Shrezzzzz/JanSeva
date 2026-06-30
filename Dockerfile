# ─────────────────────────────────────────────────────────────────
# Stage 1 — Build Frontend (Vite/React)
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Cache npm install layer separately from source
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy all frontend source and build
COPY . .
# VITE_API_BASE_URL is left unset so it falls back to '/api' (relative path).
# This means the SPA calls the same-origin Express backend — no hardcoded host.
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2 — Build Backend (TypeScript → JavaScript)
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
RUN apk add --no-cache openssl
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --ignore-scripts

COPY backend/ .
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 3 — Production image (lean)
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
ENV NODE_ENV=production

WORKDIR /app

# Install only production backend dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled backend JS
COPY --from=backend-builder /app/backend/dist ./dist

# Copy Prisma schema and generate the query engine for this platform
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy Vite frontend build into public/ — Express will serve it as static files
COPY --from=frontend-builder /app/frontend/dist ./public

# Cloud Run injects PORT at runtime (usually 8080).
# We EXPOSE a default but the actual value comes from the env var.
EXPOSE 8080

# Lightweight healthcheck — Cloud Run uses /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-8080}/health || exit 1
CMD ["node", "dist/server.js"]
