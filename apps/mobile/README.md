# Aurora Mobile

`apps/mobile` 是 Aurora Blog Platform 的 Expo 客户端，直接复用 `apps/api` 的公开接口。

## 启动前提

- API 已运行在 `3000` 端口
- 已执行根目录的 `pnpm install`

## 本地启动

在项目根目录执行：

```bash
pnpm bootstrap
pnpm dev:mobile
```

或者同时拉起 API + Expo：

```bash
pnpm dev:mobile:stack
```

## API 地址

默认情况下，移动端会自动推断 API 地址：

- Android 模拟器：`http://10.0.2.2:3000/api`
- iOS 模拟器：`http://127.0.0.1:3000/api`
- Expo Go / 真机：优先尝试当前 Metro 主机 IP

如果你想手动指定，在 `apps/mobile/.env` 中配置：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000/api
```

真机调试时，不要填手机自己的 `localhost`。

## 当前功能

- 首页内容浏览
- 文章列表筛选与分页加载
- 文章详情阅读
- 评论查看、发表评论、评论点赞
- 登录、注册、个人中心
- 阅读清单与本地缓存
- 站内通知
