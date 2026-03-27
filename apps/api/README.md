# Aurora API

`apps/api` 是 Aurora Blog Platform 的后端服务，基于 `NestJS + Prisma + PostgreSQL`。

## 常用命令

在项目根目录执行：

```bash
pnpm dev:api
pnpm build:api
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

或者直接在 `apps/api` 下执行：

```bash
pnpm start:dev
pnpm build
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

## 默认地址

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

## 环境变量

复制模板：

```bash
copy .env.example .env
```

至少确认以下字段：

- `PORT`
- `APP_URL`
- `WEB_URL`
- `ADMIN_URL`
- `JWT_SECRET`
- `DATABASE_URL`

## 说明

完整启动、部署和联调流程请回到仓库根目录查看：

- [`README.md`](../../README.md)
- [`DEPLOYMENT.md`](../../DEPLOYMENT.md)
