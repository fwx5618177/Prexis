# ============================================
# Prexis Dockerfile
# 多阶段构建：开发 & 生产
# ============================================

# 基础镜像
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# 依赖安装
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 开发环境
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# 构建
FROM deps AS builder
COPY . .
RUN pnpm build

# 生产环境（最小化镜像）
FROM node:20-alpine AS prod
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# 只复制生产依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 生成 Prisma Client
RUN pnpm prisma generate

EXPOSE 3000
USER node

CMD ["node", "dist/server.js"]
