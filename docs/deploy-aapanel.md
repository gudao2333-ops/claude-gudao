# aaPanel 部署指南（Gudao AI Chat）

## 1. 服务器环境要求
- 操作系统：Ubuntu 22.04+ / Debian 12+
- CPU/内存：建议 2C4G 起步
- 磁盘：建议 20GB+（含日志与数据库备份）
- 网络：可访问 NewAPI 网关地址

## 2. Node.js 版本
- 推荐 Node.js 20 LTS 或更高版本。
- 检查：
  ```bash
  node -v
  npm -v
  ```

## 3. PostgreSQL 配置
- 推荐 PostgreSQL 14+。
- 创建数据库与用户（示例）：
  ```sql
  CREATE USER gudao WITH PASSWORD 'strong-password';
  CREATE DATABASE gudao_ai_chat OWNER gudao;
  GRANT ALL PRIVILEGES ON DATABASE gudao_ai_chat TO gudao;
  ```

## 4. 上传项目
- 在 aaPanel 新建站点目录（例如 `/www/wwwroot/claude-gudao`）。
- 通过 Git 拉取或 SFTP 上传项目代码。

## 5. 安装依赖
```bash
cd /www/wwwroot/claude-gudao
npm install
```

## 6. 配置 .env
```bash
cp .env.example .env
```
请填入生产配置：
- `DATABASE_URL`
- `JWT_SECRET`（高强度）
- `APP_URL`
- `NEWAPI_BASE_URL`
- `NEWAPI_API_KEY`
- `NEWAPI_DEFAULT_GROUP`
- `DEFAULT_QUOTA_TO_CNY_RATE`
- `DEFAULT_PROFIT_RATE`
- `REDEEM_BUY_URL`

## 7. 执行 Prisma 迁移（生产）
```bash
npx prisma migrate deploy
```

## 8. 执行 seed
```bash
npm run db:seed
```
> 首次部署建议执行；重复执行前请确认不会覆盖你已生产化的数据策略。

## 9. 构建项目
```bash
npm run build
```

## 10. PM2 启动
```bash
pm2 start npm --name claude-gudao -- start
pm2 save
pm2 startup
```

## 11. Nginx 反代
示例：
```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## 12. HTTPS 配置建议
- 使用 aaPanel 申请 Let’s Encrypt 证书。
- 强制 HTTP -> HTTPS 跳转。
- 开启自动续签。

## 13. 常见错误排查
1. `P1001 Can't reach database server`
   - 检查 `DATABASE_URL`、数据库监听地址、防火墙。
2. `JWT_SECRET` 太弱或为空
   - 替换为高强度随机字符串。
3. `build` 失败
   - 确认 Node 版本与依赖安装完整，执行 `npm ci` 重试。
4. `502 Bad Gateway`
   - 检查 PM2 进程状态与 Nginx 反代端口。
5. NewAPI 连接失败
   - 检查 `NEWAPI_BASE_URL`、`NEWAPI_API_KEY`、服务器出网策略。
