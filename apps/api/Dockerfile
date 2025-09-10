# ---------- prune ----------
FROM node:20 AS pruner
WORKDIR /repo
COPY . .
ARG TURBO_SCOPE=@tcpl-cpm/api
RUN npx turbo prune --scope=$TURBO_SCOPE --docker

# ---------- install ----------
FROM node:20 AS installer
WORKDIR /repo
# Pruned workspace
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/package-lock.json ./package-lock.json
COPY --from=pruner /repo/out/full/ ./
COPY --from=pruner /repo/turbo.json ./turbo.json
# Prisma schema can be omitted by prune; copy it explicitly
COPY --from=pruner /repo/apps/api/prisma ./apps/api/prisma

# native deps for bcrypt/prisma builds
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# install all workspace deps
RUN npm ci --workspaces --include-workspace-root

# ---------- build ----------
FROM node:20 AS builder
WORKDIR /repo
COPY --from=installer /repo ./

# Generate Prisma Client so TypeScript has generated types during build
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

# Build API and its deps
RUN npx turbo run build --filter=@tcpl-cpm/api...

# ---------- prod deps only ----------
FROM node:20 AS proddeps
WORKDIR /repo
COPY --from=installer /repo ./

# Ensure Prisma Client is generated in THIS node_modules (the one we copy to runtime)
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

# Then prune dev deps
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-slim AS runner
WORKDIR /repo
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy production node_modules with a generated Prisma Client
COPY --from=proddeps /repo/node_modules ./node_modules

# Copy built output
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

# If API imports a built workspace package (e.g., @tcpl-cpm/config), copy its build
COPY --from=installer /repo/packages/config/package.json ./packages/config/package.json
COPY --from=builder   /repo/packages/config/dist          ./packages/config/dist

EXPOSE 4000
CMD ["node", "--enable-source-maps", "apps/api/dist/server.js"]
