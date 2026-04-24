import { prisma } from '@/lib/prisma';
import { fetchPricing } from './newapi.service';

export async function getVisibleModelsForUser() {
  return prisma.aiModel.findMany({ where: { enabled: true, visible: true }, orderBy: { sort: 'asc' } });
}

export async function getAdminModels() {
  return prisma.aiModel.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createModel(data: Parameters<typeof prisma.aiModel.create>[0]['data']) {
  return prisma.aiModel.create({ data });
}

export async function updateModel(id: string, data: Parameters<typeof prisma.aiModel.update>[0]['data']) {
  return prisma.aiModel.update({ where: { id }, data });
}

export async function deleteModel(id: string) {
  return prisma.aiModel.delete({ where: { id } });
}

export async function syncNewApiPricing() {
  const pricing = await fetchPricing();
  const items = Array.isArray(pricing?.data) ? pricing.data : [];

  for (const p of items) {
    const modelName = String(p.model ?? '');
    const exists = await prisma.aiModel.findFirst({ where: { newapiModelName: modelName } });
    if (!exists) continue;

    await prisma.aiModel.update({
      where: { id: exists.id },
      data: {
        modelRatio: String(p.model_ratio ?? exists.modelRatio),
        completionRatio: String(p.completion_ratio ?? exists.completionRatio),
        modelPrice: String(p.model_price ?? exists.modelPrice),
        quotaType: Number(p.quota_type ?? exists.quotaType),
        groupRatio: String(p.group_ratio ?? exists.groupRatio),
      },
    });
  }

  return { synced: items.length };
}

export async function testModelAvailability() {
  return { ok: true, message: 'reserved for future implementation' };
}
