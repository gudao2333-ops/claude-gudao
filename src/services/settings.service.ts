import { prisma } from '@/lib/prisma';

const PUBLIC_KEYS = ['site_name', 'redeem_buy_url', 'allow_register', 'maintenance_mode'] as const;
const ADMIN_KEYS = [
  'newapi_base_url',
  'newapi_api_key',
  'newapi_default_group',
  'default_quota_to_cny_rate',
  'default_profit_rate',
  'redeem_buy_url',
  'allow_register',
  'site_name',
  'maintenance_mode',
] as const;

export async function getSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string, description?: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value, description },
    create: { key, value, description },
  });
}

export async function getPublicSettings() {
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: [...PUBLIC_KEYS] } } });
  return Object.fromEntries(settings.map((item) => [item.key, item.value]));
}

export async function getAdminSettings(maskApiKey = true) {
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: [...ADMIN_KEYS] } } });
  const mapped = Object.fromEntries(settings.map((item) => [item.key, item.value]));
  if (maskApiKey && mapped.newapi_api_key) {
    mapped.newapi_api_key = String(mapped.newapi_api_key).replace(/^(.{4}).+(.{4})$/, '$1****$2');
  }
  return mapped;
}
