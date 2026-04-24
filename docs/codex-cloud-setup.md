# Codex 云端环境 PostgreSQL Setup

本项目默认使用 PostgreSQL。若你在 Codex 云端容器中运行，**不要假设本地已有数据库**，请先执行下面脚本。

## 1) 一键 setup

```bash
bash scripts/codex-setup.sh
```

脚本会尝试完成以下步骤：
1. 安装 PostgreSQL server/client（`apt-get` 可用时）。
2. 启动 PostgreSQL 服务（兼容 `pg_ctlcluster` / `service`）。
3. 创建用户：`gudao`（密码 `gudao123456`）。
4. 创建数据库：`gudao_ai_chat`。
5. 写入 `.env` 的 `DATABASE_URL`。

成功后默认连接串为：

```env
DATABASE_URL="postgresql://gudao:gudao123456@127.0.0.1:5432/gudao_ai_chat?schema=public"
```

## 2) 若 Codex 环境不允许启动 PostgreSQL

部分云端环境可能存在限制（例如无法安装系统包或无法启动服务）。如果脚本提示无法就绪，请改用外部 PostgreSQL：

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
```

推荐外部托管 PostgreSQL（Neon/Supabase/RDS 等），并确保：
- 网络可达；
- 账号有建表权限；
- 库名与 schema 正确。

## 3) 初始化与校验命令

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run lint
npm run typecheck
npm run build
```

## 4) 常见排查

- `P1001 Can't reach database server`：检查 PostgreSQL 服务是否启动、端口是否是 `5432`、`DATABASE_URL` 是否正确。
- `permission denied`：确认数据库用户拥有目标库权限。
- `Prisma migrate 卡住`：先用 `psql` 直连验证账号可登录，再重试 migrate。
