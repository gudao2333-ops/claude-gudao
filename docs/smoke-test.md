# 上线后 Smoke Test（手动）

## A. 管理后台流程
1. 管理员登录 `/login`。
2. 进入 `/admin/settings`，修改并保存系统设置。
3. 进入 `/admin/newapi`，执行“测试连接”。
4. 执行“同步价格”，确认结果提示。
5. 进入 `/admin/redeem-codes`，创建兑换码（单个或批量）。

## B. 用户流程
1. 普通用户注册 `/register`。
2. 登录后访问 `/redeem`，输入兑换码充值。
3. 进入 `/chat` 发起对话。
4. 检查聊天后余额是否变化。
5. 访问 `/billing` 检查流水。
6. 访问 `/bills` 检查账单。

## C. 后台核对
1. 进入 `/admin/bills` 检查账单详情。
2. 进入 `/admin/balance-logs` 检查余额流水。
3. 进入 `/admin/users` 检查用户余额与冻结余额。

## D. 安全核对
1. 前台 `/api/public/settings` 不应返回 `newapi_api_key`。
2. 前台账单接口不应泄露真实模型名、quota、倍率、rawUsage。
3. 页面与接口错误信息不应暴露堆栈与敏感密钥。
