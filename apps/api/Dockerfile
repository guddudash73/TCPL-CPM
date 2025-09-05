# ---------- prune ----------
FROM node:20 AS pruner
WORKDIR /repo
COPY . .
ARG TURBO_SCOPE=@tcpl-cpm/api
RUN npx turbo prune --scope=$TURBO_SCOPE --docker

# ---------- install ----------
FROM node:20 AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/package-lock.json ./package-lock.json
COPY --from=pruner /repo/out/full/ .
COPY --from=pruner /repo/turbo.json turbo.json

# native deps for bcrypt/prisma builds (adjust as needed)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm ci --workspaces --include-workspace-root

# ---------- build ----------
FROM node:20 AS builder
WORKDIR /repo
COPY --from=installer /repo .
RUN npm run db:generate --workspace=@tcpl-cpm/api
# Build API **and its dependencies**
RUN npx turbo run build --filter=@tcpl-cpm/api...

# ---------- prod deps only ----------
FROM node:20 AS proddeps
WORKDIR /repo
COPY --from=installer /repo .
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-slim AS runner
WORKDIR /repo

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# node_modules contains workspace symlinks → copy the workspace target used at runtime
COPY --from=proddeps /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
# ensure @tcpl-cpm/config (workspace) is available at its symlink target
COPY --from=installer /repo/packages/config/package.json ./packages/config/package.json
COPY --from=builder   /repo/packages/config/dist          ./packages/config/dist

EXPOSE 4000
CMD ["node", "--enable-source-maps", "apps/api/dist/server.js"]
