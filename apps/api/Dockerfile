FROM node:20 AS pruner
WORKDIR /repo
COPY . .
ARG TURBO_SCOPE=@tcpl-cpm/api
RUN npx turbo prune --scope=$TURBO_SCOPE --docker

FROM node:20 AS installer
WORKDIR /repo 
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/package-lock.json ./package-lock.json
COPY --from=pruner /repo/out/full/ .
COPY --from=pruner /repo/turbo.json turbo.json

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm ci --workspaces --include-workspace-root
RUN node -e "console.log('tsc path:', process.env.PATH)"
RUN npx -w @tcpl-cpm/api tsc -v || true

FROM node:20 AS builder
WORKDIR /repo
COPY --from=installer /repo .
RUN npm run db:generate --workspace=@tcpl-cpm/api
RUN npm run build --workspace=@tcpl-cpm/api

FROM node:20 AS proddeps
WORKDIR /repo
COPY --from=installer /repo .
RUN npm prune --omit=dev

FROM node:20-slim AS runner
WORKDIR /repo

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
COPY --from=proddeps /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
EXPOSE 4000
CMD ["node", "--enable-source-maps", "apps/api/dist/server.js"]
