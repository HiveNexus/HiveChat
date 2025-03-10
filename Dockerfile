# 依赖构建阶段
FROM node:22-alpine AS deps
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci

# 构建阶段
FROM node:22-alpine AS builder
WORKDIR /app

# 复制依赖和源代码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN npm run build

# 运行阶段（最终镜像）
FROM node:22-alpine AS runner
WORKDIR /app

# 设置环境变量
ENV NODE_ENV production
ENV IS_DOCKER true

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN apk add --no-cache bash

# 暴露端口
EXPOSE 3000

# 入口命令
CMD ["node", "server.js"]