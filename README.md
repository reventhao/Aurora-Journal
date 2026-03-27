# Aurora Blog Platform

一个前后端分离的博客平台 Monorepo，包含访客前台、后台管理、NestJS API 和 Expo 移动端。

## 项目组成

- `apps/web`
  访客前台，基于 `Vite + Vue 3 + TypeScript`
- `apps/admin`
  后台管理系统，基于 `Vite + Vue 3 + Arco Design`
- `apps/api`
  服务端 API，基于 `NestJS + Prisma + PostgreSQL`
- `apps/mobile`
  Expo 移动端客户端
- `packages/shared`
  前后端共享类型与常量

## 当前能力

- 博客首页、文章详情、分类页、标签页、关于页
- 后台文章、分类、标签、评论、媒体库、回收站、用户、角色、站点设置
- 首页布局编排、博客导航管理、公告弹窗、配置版本恢复
- JWT 登录鉴权、权限控制、Swagger 文档
- 本地上传、缩略图、媒体引用统计
- Expo 移动端阅读、评论、通知、个人中心、阅读清单

## 技术栈

- Frontend: Vue 3, Vite, Pinia, Vue Router, Arco Design
- Backend: NestJS, Prisma, PostgreSQL
- Mobile: Expo, React Native
- Workspace: pnpm workspace

## 环境要求

- Node.js `>= 20`
- pnpm `>= 10`
- PostgreSQL `>= 16`

可选：

- Docker / Docker Compose
- Expo Go 或 Android / iOS 模拟器

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 生成本地环境文件

```bash
pnpm bootstrap
```

这条命令会在以下位置创建 `.env`，已存在时不会覆盖：

- `apps/api/.env`
- `apps/web/.env`
- `apps/admin/.env`
- `apps/mobile/.env`

### 3. 启动数据库

如果本机没有 PostgreSQL，最省事的方式是只拉起数据库容器：

```bash
docker compose up -d postgres
```

默认数据库配置：

- database: `aurora_blog`
- username: `postgres`
- password: `postgres`
- port: `5432`

### 4. 初始化 Prisma

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. 启动开发环境

```bash
pnpm dev
```

默认会启动：

- API: `http://localhost:3000`
- Web: `http://localhost:5173`
- Admin: `http://localhost:5174`

如果你还要一起启动 Expo 移动端：

```bash
pnpm dev:all
```

只想跑移动端加 API：

```bash
pnpm dev:mobile:stack
```

## 默认账号

执行 `pnpm db:seed` 后会生成默认管理员：

- 邮箱：`admin@aurora.local`
- 密码：`Admin@123456`

## 常用脚本

```bash
pnpm bootstrap
pnpm dev
pnpm dev:all
pnpm dev:web
pnpm dev:admin
pnpm dev:api
pnpm dev:mobile
pnpm build
pnpm build:web
pnpm build:admin
pnpm build:api
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## 环境变量说明

### `apps/api/.env`

核心变量：

- `PORT`
  API 端口，默认 `3000`
- `APP_URL`
  API 对外地址
- `WEB_URL`
  前台地址，用于跨域和链接生成
- `ADMIN_URL`
  后台地址，用于跨域和链接生成
- `JWT_SECRET`
  JWT 密钥，生产环境必须修改
- `DATABASE_URL`
  PostgreSQL 连接串
- `UPLOAD_DIR`
  本地上传目录

可选能力：

- `PEXELS_API_KEY`
  启用 Pexels 素材搜索
- `SMTP_*`
  启用邮件验证码或通知
- `ASSISTANT_*`
  对接外部 AI 助手能力

### `apps/web/.env` 和 `apps/admin/.env`

- `VITE_API_BASE_URL`
  API 基础地址。开发环境默认走 Vite 代理，保留默认值即可。
- `VITE_ALLOWED_HOSTS`
  需要额外放行的 Host，多个值用逗号分隔。

### `apps/mobile/.env`

- `EXPO_PUBLIC_API_BASE_URL`
  留空时会自动按 Expo 当前运行环境推断。
  真机调试时，建议显式改成运行 API 那台电脑的局域网地址，例如：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000/api
```

## Docker 快速体验

如果你想直接体验容器化部署：

```bash
docker compose up --build -d
```

然后执行迁移和种子：

```bash
docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
docker compose exec api pnpm prisma:seed
```

默认访问地址：

- Web: `http://localhost:8080`
- Admin: `http://localhost:8081`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

## 构建验证

提交或发布前建议至少跑一遍：

```bash
pnpm build
```

如果只验证主链路：

```bash
pnpm --filter @aurora/shared build
pnpm --filter @aurora/api build
pnpm --filter @aurora/admin build
pnpm --filter @aurora/web build
```

## 常见问题

### 1. 前台或后台报 `proxy ECONNREFUSED 127.0.0.1:3000`

说明 API 没启动。先确认：

```bash
pnpm dev:api
```

或者直接重新执行：

```bash
pnpm dev
```

### 2. Prisma 迁移失败

先确认 PostgreSQL 已启动，且 `apps/api/.env` 里的 `DATABASE_URL` 正确。

### 3. 移动端一直连不上 API

真机调试不要用手机自己的 `localhost`。把 `apps/mobile/.env` 里的 `EXPO_PUBLIC_API_BASE_URL` 改成电脑局域网 IP。

### 4. 图片地址在前端显示不出来

API 生成的本地上传地址依赖 `APP_URL`。如果你换了域名、端口或反向代理，记得同步更新 `apps/api/.env`。

## 目录结构

```text
.
├─ apps/
│  ├─ admin/
│  ├─ api/
│  ├─ mobile/
│  └─ web/
├─ packages/
│  └─ shared/
├─ scripts/
├─ docker-compose.yml
└─ pnpm-workspace.yaml
```

## 部署

生产部署说明见：

- [DEPLOYMENT.md](./DEPLOYMENT.md)

## License

本项目使用 [MIT License](./LICENSE)。
