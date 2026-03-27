# Deployment Guide

本文档说明如何把 Aurora Blog Platform 部署到生产环境。

## 部署形态

推荐部署为 4 个独立部分：

- PostgreSQL
- API (`apps/api`)
- Web (`apps/web`)
- Admin (`apps/admin`)

移动端 `apps/mobile` 不参与服务端部署。

## 生产环境要求

- Node.js `>= 20`
- pnpm `>= 10`
- PostgreSQL `>= 16`
- 反向代理或网关（Nginx / Caddy / Traefik 任一即可）

## 必改环境变量

生产环境至少要修改这些值：

```bash
PORT=3000
HOST=0.0.0.0
APP_URL=https://api.example.com
WEB_URL=https://www.example.com
ADMIN_URL=https://admin.example.com
JWT_SECRET=replace-with-a-strong-secret
DATABASE_URL=postgresql://user:password@host:5432/aurora_blog?schema=public
UPLOAD_DIR=uploads
```

如果启用邮件：

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=Aurora Admin
SMTP_FROM_EMAIL=
```

如果启用 Pexels：

```bash
PEXELS_API_KEY=
```

## 方案一：Docker Compose

### 1. 构建并启动

```bash
docker compose up --build -d
```

### 2. 执行数据库迁移

```bash
docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

### 3. 初始化种子数据

```bash
docker compose exec api pnpm prisma:seed
```

### 4. 验证服务

- Web: `http://localhost:8080`
- Admin: `http://localhost:8081`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

## 方案二：Node 进程部署

### 1. 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 2. 构建

```bash
pnpm build
```

### 3. 执行 Prisma

```bash
pnpm db:generate
pnpm --filter @aurora/api exec prisma migrate deploy
pnpm db:seed
```

### 4. 启动 API

```bash
pnpm --filter @aurora/api start:prod
```

前台和后台可以：

- 直接部署各自 `dist` 到静态站点
- 或者接入 Nginx / Caddy 托管

## 反向代理建议

推荐拆成 3 个域名：

- `www.example.com` -> `apps/web`
- `admin.example.com` -> `apps/admin`
- `api.example.com` -> `apps/api`

如果上传目录由 API 提供静态访问，记得把 `/uploads/` 也代理到 API。

## 文件上传

默认上传目录是本地磁盘：

- `apps/api/uploads`

生产环境建议：

- 把 `UPLOAD_DIR` 指到持久化卷
- 或接入对象存储，再在 API 层统一生成 URL

## 数据库建议

- 给 PostgreSQL 做定时备份
- 不要把 `prisma migrate dev` 用在生产环境
- 生产环境统一使用 `prisma migrate deploy`

## 发布检查清单

- 已修改 `JWT_SECRET`
- 已修改 `DATABASE_URL`
- 已修改 `APP_URL` / `WEB_URL` / `ADMIN_URL`
- 已确认上传目录可持久化
- 已执行 `prisma migrate deploy`
- 已执行种子数据初始化（如需要）
- 已验证管理员登录
- 已验证前台文章、媒体和评论接口

## 推荐上线后验证

- 打开首页，检查文章列表与图片是否正常
- 登录后台，检查仪表盘和文章管理页
- 打开 `https://api.example.com/docs`，确认 Swagger 可用
- 上传一张图片，确认 `/uploads/*` 可访问
- 新建一篇文章并发布，确认前台可见
