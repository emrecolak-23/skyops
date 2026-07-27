FROM node:25-alpine3.22 AS base
RUN npm install -g pnpm@10.22.0
WORKDIR /app

# ---- build ----
FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @skyops/shared build
RUN pnpm --filter @skyops/api build

# ---- production ----
FROM node:25-alpine3.22 AS production
ENV NODE_ENV=production
ENV npm_config_minimum_release_age=0
WORKDIR /app
RUN npm install -g pnpm@10.22.0

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]