# claude-gudao

面向中文用户的商用 AI 对话平台（Claude 风格体验参考版，不使用 Claude 官方商标/素材）。
系统已完成：数据库模型、服务层、人民币计费核心、NewAPI Gateway、用户 API、管理员 API、兑换码系统。
本项目不做在线支付，充值仅通过兑换码。

## 1. 项目介绍
- 前台：注册/登录、对话、余额查看、兑换码充值、账单与流水查看。
- 后台：用户、模型、账单、流水、兑换码、系统设置、公告、NewAPI 联调。
- 网关：前台永远不直接接触 NewAPI，所有模型调用经过后端 AI Gateway。
- 计费：全站人民币（CNY）结算，支持预扣、多退少补、estimated 账单。

## 2. 技术栈
- Next.js App Router + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Decimal.js（金额计算）
- Zod（参数校验）
- bcryptjs + JWT Cookie（认证）
- react-markdown + remark-gfm + rehype-highlight
- Vitest（单元测试）

## 3. 本地开发
### 3.1 安装依赖
```bash
npm install
```

### 3.2 配置 .env
```bash
cp .env.example .env
```

### 3.3 初始化数据库 / 迁移 / seed
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 3.4 启动开发服务
```bash
npm run dev
```

### 3.5 质量检查
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 4. 环境变量说明
- `DATABASE_URL`：PostgreSQL 连接串
- `JWT_SECRET`：JWT 签名密钥（生产环境务必更换）
- `APP_URL`：站点地址
- `NEWAPI_BASE_URL`：NewAPI 网关地址
- `NEWAPI_API_KEY`：NewAPI Key（仅后端使用）
- `NEWAPI_DEFAULT_GROUP`：默认分组
- `DEFAULT_QUOTA_TO_CNY_RATE`：默认 quota->人民币换算
- `DEFAULT_PROFIT_RATE`：默认利润倍率
- `REDEEM_BUY_URL`：购买兑换码跳转地址

## 5. NewAPI 对接说明
1. 在 `.env` 配置 `NEWAPI_BASE_URL` 和 `NEWAPI_API_KEY`。
2. 在后台 `/admin/newapi` 点击“测试连接”。
3. 点击“同步价格”同步上游模型计价参数。
4. 在 `/admin/models` 配置前台展示模型（`name/modelKey`）与真实模型名映射（`newapiModelName`）。
5. 前台用户看不到 NewAPI 的原因：
   - 所有请求走 `/api/chat` 或 `/api/chat/stream`；
   - 前台只看到展示模型信息，不返回真实模型名和网关参数。

## 6. 人民币计费说明
- 全站金额字段统一 CNY。
- 请求流程：`pre_hold` 预扣 → 调用模型 → `settleBill` 结算。
- 若实际费用 < 预扣：退回差额（`refund_hold`）。
- 若实际费用 > 预扣：补扣差额（`extra_deduct`）。
- 支持三种计费：
  - NewAPI 倍率计费（`newapi_ratio`）
  - 精细 token 计费（`detailed_token`）
  - 固定按次计费（`fixed`）
- usage 缺失时启用估算兜底并标记 `estimated`。
- 核心账务字段：`costCny / userCostCny / profitCny`。
- 所有余额变动都写入 `BalanceLog`。

## 7. 兑换码充值说明
- 管理员可在 `/admin/redeem-codes` 单个创建或批量生成。
- 可设置金额、批次号、过期时间、备注。
- 支持 CSV 导出、单条复制、批量复制未使用码（便于第三方发货）。
- 用户在 `/redeem` 输入兑换码充值。
- 购买入口地址由 `REDEEM_BUY_URL` 或系统设置 `redeem_buy_url` 提供。
- 仅未使用兑换码可禁用；已使用码不可禁用。
- 防重复兑换：事务 + 行锁 + 状态校验。

## 8. 部署说明
### 8.1 Node / PostgreSQL 要求
- Node.js 20+
- PostgreSQL 14+

### 8.2 构建与启动
```bash
npm install
npm run db:generate
npm run db:migrate
npm run build
npm run start
```

### 8.3 PM2 示例
```bash
pm2 start npm --name claude-gudao -- start
pm2 save
```

### 8.4 aaPanel 注意事项
- 站点运行用户需有项目目录读写权限
- 确保 `.env` 存在且不暴露给公网
- 反向代理目标指向 Next.js 监听端口

### 8.5 Nginx 反代示例
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

### 8.6 生产环境变量
- 强制设置高强度 `JWT_SECRET`
- `NEWAPI_API_KEY` 仅部署机可见
- `DATABASE_URL` 使用最小权限账号

### 8.7 数据库备份建议
- 每日逻辑备份 + 每周全量备份
- 备份文件异地保存
- 定期演练恢复

## 9. 安全注意事项
- 严禁泄露 `NEWAPI_API_KEY`
- 严禁前端展示真实模型名、倍率、quota
- 生产环境必须更换 `JWT_SECRET`
- 管理员账号建议开启二次验证（后续可扩展）
- 兑换码兑换必须事务化，防并发重复使用

## 10. 常见问题（FAQ）
1. **NewAPI 返回 usage 缺失怎么办？**
   - 系统会估算 token 并生成 `estimated` 账单。
2. **流式请求中断怎么办？**
   - 系统会触发退款兜底，避免冻结余额卡住。
3. **余额补扣不足怎么办？**
   - 结算时会报余额不足并阻止异常扣费。
4. **模型价格同步失败怎么办？**
   - 到 `/admin/newapi` 查看失败信息，检查地址/Key/网络。
5. **为什么前台不显示 token 明细？**
   - 为小白用户简化展示，详细明细在账单页折叠查看。
6. **为什么后台可以看到 quota？**
   - 后台用于审计和运维，前台做脱敏。
7. **兑换码已使用怎么办？**
   - 状态不可逆，需发放新码。
8. **如何批量生成不同金额兑换码？**
   - 分批次执行批量创建，分别设置金额。
9. **如何更换购买兑换码地址？**
   - 在 `/admin/settings` 修改 `redeem_buy_url`。

## 11. 用户端数据脱敏规则
- 用户端 API（`/api/models`、`/api/bills`、`/api/chat`、`/api/chat/stream`）不返回：
  - `newapiModelName`
  - `modelRatio` / `completionRatio` / `groupRatio`
  - `modelPrice` / `quota` / `rawUsage`
  - 任何 NewAPI Key 或上游敏感错误

## 12. 管理员端可见字段规则
- 管理员端可查看完整审计字段：
  - `newapiModelName`
  - `quota`
  - `modelRatio` / `completionRatio` / `groupRatio`
  - `rawUsage`
  - `costCny` / `userCostCny` / `profitCny`
- `newapi_api_key` 默认脱敏显示。

## 13. 部署与验收文档索引
- [aaPanel 部署指南](./docs/deploy-aapanel.md)
- [生产上线检查清单](./docs/production-checklist.md)
- [上线后 Smoke Test](./docs/smoke-test.md)

## 多渠道 NewAPI 配置（2026-04）
- 支持在 `/admin/channels` 管理多个 NewAPI 渠道（baseUrl/apiKey/defaultGroup/priority/timeout）。
- 全局 `NEWAPI_BASE_URL` / `NEWAPI_API_KEY` 仍作为默认兼容配置，并在 seed 时初始化默认渠道。
- 推荐在后台将模型绑定到具体渠道，按渠道测试连接与同步价格。

## 模型绑定渠道与价格配置
- 每个模型支持绑定 `channelId`。
- 计费模式支持 `newapi_ratio`、`detailed_token`、`fixed` 三种。
- 管理端模型表单支持详细价格字段配置；前台 `/api/models` 仍只返回安全展示字段。

## 兑换码筛选与导出
- `/admin/redeem-codes` 支持 code/status/batchNo/amount/usedBy/时间范围筛选。
- 支持单个创建、批量生成、按筛选导出 CSV、批次统计汇总。

## 流式输出显示 data: 原始文本排查
- 前端已改为逐行解析 SSE `data:`，仅拼接 `choices[0].delta.content`。
- 会忽略 `[DONE]` 与仅 usage chunk，避免将原始 JSON 显示到聊天正文。
