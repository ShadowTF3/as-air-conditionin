# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev --include=optional

FROM dependencies AS build
COPY . .
# Build without credentials. Supabase and admin secrets are runtime variables.
RUN npm run typecheck && npm run build

FROM node:24-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=10000 \
    SITE_STORAGE_MODE=supabase \
    SUPABASE_STORAGE_BUCKET=site-media
COPY --from=build --chown=node:node /app/dist/standalone/ ./
COPY --chown=node:node scripts/start-container.mjs ./scripts/start-container.mjs
USER node
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health', {signal: AbortSignal.timeout(4500)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "scripts/start-container.mjs"]
