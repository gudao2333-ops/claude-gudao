# AGENTS.md

## 1. 项目目标
- 构建商用 AI 对话平台（项目名：claude-gudao），面向中文用户。
- 前端体验参考 Claude 风格的简洁、暖色、圆角和大留白，但不得使用 Claude 商标、Logo、图标或官方素材。
- 用户在本站完成注册、登录、兑换码充值、发起对话、查看余额与消费。
- NewAPI 仅作为后端模型网关，必须对用户透明不可见。

## 2. 技术栈
- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Decimal.js（金额计算）
- Zod（输入校验）
- bcryptjs（密码哈希）
- jsonwebtoken / 安全 Cookie（登录鉴权）
- nanoid
- react-markdown + remark-gfm + rehype-highlight
- lucide-react

## 3. 目录规范
- `src/app`：App Router 页面与路由
- `src/components`：可复用组件
- `src/lib`：基础库（数据库、鉴权、工具函数）
- `src/modules`：业务模块（ai-gateway、billing、redeem、admin）
- `src/types`：共享类型定义
- `prisma/schema.prisma`：数据模型
- `prisma/seed.ts`：初始化种子
- `docs/`：业务文档与设计文档

## 4. 数据库规范
- 所有金额字段使用 `Decimal`，统一人民币（CNY）。
- 使用 enum 管理状态与类型，禁止魔法字符串。
- 关键关联必须补全外键与索引。
- 模型中禁止出现 `usdToCny`、`fixedPriceUsd`、`usdCost` 等美元字段。
- 不建立在线支付订单与易支付相关表。

## 5. 计费系统规则
- 所有模型请求必须先创建 `ChatBill`（pending）。
- 调用前执行预扣（冻结余额），并记录 `BalanceLog(type=pre_hold)`。
- 成功后按 usage 结算：写入成本、用户扣费、利润、状态。
- 若 usage 缺失，使用估算 token 并将账单置为 `estimated`。
- 调用失败必须退款冻结金额并记录 `BalanceLog(type=refund_hold)`。
- 每次余额变化必须写 `BalanceLog`，严禁无日志改余额。

## 6. NewAPI 对接规则
- 永远不要将 NewAPI Base URL、API Key、真实模型名暴露给前端。
- 所有模型调用必须经过后端 AI Gateway。
- 前台仅看到平台模型别名与展示名，不显示 NewAPI 字样。
- 后端可保存原始 usage 和 response id，供审计使用。

## 7. 兑换码系统规则
- 本系统仅支持兑换码充值，不做在线支付。
- 兑换必须使用事务 + 行锁，防止并发重复兑换。
- 成功兑换必须写 `BalanceLog(type=redeem)`。
- 支持批量生成、禁用、过期、批次号管理。
- 前台支持显示“没有兑换码？前往购买”（读取 `REDEEM_BUY_URL`）。

## 8. 安全规则
- 密码必须哈希存储，禁止明文。
- 所有 API 输入必须通过 Zod 校验。
- 所有 admin API 必须验证 `role=admin`。
- API 响应不得返回 NewAPI Key、堆栈、内部路径、敏感环境变量。
- 关键账务与兑换逻辑必须使用事务。

## 9. 前端 UI 风格规则
- 风格参考 Claude：简洁、柔和、留白、圆角卡片。
- 仅保留体验风格，不使用任何 Claude 官方素材或品牌标识。
- 小白用户视图仅显示必要信息：余额、本次消耗、模型展示名。
- 禁止在前台展示 quota、倍率、分组、真实模型名、NewAPI 术语。

## 10. 后台管理规则
- 管理员可查看完整 usage、quota、倍率、分组、真实模型名、原始响应。
- 可管理模型、公告、系统设置、兑换码批次、用户状态与余额。
- 任何后台改价和配置信息变更建议记录审计日志。

## 11. 禁止事项
- 禁止前端直连 NewAPI。
- 禁止在前端返回真实模型名或网关配置。
- 禁止使用 JS 浮点数处理金额。
- 禁止引入在线支付/易支付订单流程与数据模型。
- 禁止在代码与仓库中提交真实密钥。

## 12. 测试与构建要求
- 提交前至少通过：`npm run lint`。
- Prisma 相关必须执行：`npx prisma format`、`npx prisma generate`、`npx prisma migrate dev --name init`、`npm run db:seed`。
- 新增模型后必须补充 migration 与 seed 可运行性验证。
