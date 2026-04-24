import bcrypt from 'bcryptjs';
import { PrismaClient, BillingMode, UserRole, UserStatus, RedeemCodeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash('admin123456', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: UserRole.admin,
      status: UserStatus.active,
      balance: '0',
      frozenBalance: '0',
    },
    create: {
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      nickname: '系统管理员',
      role: UserRole.admin,
      status: UserStatus.active,
      balance: '0',
      frozenBalance: '0',
    },
  });

  const settings: Array<{ key: string; value: string; description: string }> = [
    { key: 'newapi_base_url', value: 'https://api.gudao.one', description: 'NewAPI 网关地址' },
    { key: 'newapi_api_key', value: 'sk-your-newapi-key', description: 'NewAPI 访问密钥（示例占位）' },
    { key: 'newapi_default_group', value: 'default', description: '默认模型分组' },
    { key: 'default_quota_to_cny_rate', value: '0.000015', description: '默认 quota 到人民币汇率' },
    { key: 'default_profit_rate', value: '1.6', description: '默认利润倍率' },
    { key: 'redeem_buy_url', value: 'https://shop.gudao.one', description: '兑换码购买地址' },
    { key: 'allow_register', value: 'true', description: '是否允许注册' },
    { key: 'site_name', value: 'Gudao AI Chat', description: '站点名称' },
    { key: 'maintenance_mode', value: 'false', description: '维护模式' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }

  const models = [
    {
      name: '智能版',
      modelKey: 'smart',
      newapiModelName: 'claude-sonnet-4-6',
      provider: 'newapi',
      description: '日常通用对话模型',
      billingMode: BillingMode.newapi_ratio,
    },
    {
      name: '专业版',
      modelKey: 'pro',
      newapiModelName: 'gpt-5.4-mini',
      provider: 'newapi',
      description: '复杂任务与代码场景',
      billingMode: BillingMode.newapi_ratio,
    },
    {
      name: '深度思考版',
      modelKey: 'deep-think',
      newapiModelName: 'deepseek-r1',
      provider: 'newapi',
      description: '推理分析场景模型',
      billingMode: BillingMode.newapi_ratio,
    },
  ];

  for (const model of models) {
    await prisma.aiModel.upsert({
      where: { modelKey: model.modelKey },
      update: {
        ...model,
        quotaToCnyRate: '0.000015',
        profitRate: '1.6',
      },
      create: {
        ...model,
        quotaToCnyRate: '0.000015',
        profitRate: '1.6',
      },
    });
  }

  await prisma.redeemCode.upsert({
    where: { code: 'TEST-100' },
    update: {
      amount: '100',
      status: RedeemCodeStatus.unused,
      remark: '测试兑换码：100 元余额',
    },
    create: {
      code: 'TEST-100',
      amount: '100',
      status: RedeemCodeStatus.unused,
      remark: '测试兑换码：100 元余额',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
