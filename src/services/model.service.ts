import { prisma } from '@/lib/prisma';
import { fetchPricing } from './newapi.service';
import { getChannelForModel } from './channel.service';

export async function getVisibleModelsForUser() {
  return prisma.aiModel.findMany({ where: { enabled: true, visible: true }, orderBy: { sort: 'asc' } });
}

export async function getAdminModels() {
  return prisma.aiModel.findMany({ include: { channel: true }, orderBy: { createdAt: 'desc' } });
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

export async function syncNewApiPricing(channelId?: string) {
  const targetModels = await prisma.aiModel.findMany({ where: channelId ? { channelId } : undefined });
  let synced = 0;
  for (const model of targetModels) {
    const channel = await getChannelForModel(model.id, model.channelId);
    if (!channel) continue;
    const pricing = await fetchPricing({
      baseUrl: channel.baseUrl,
      apiKey: channel.apiKey,
      group: channel.defaultGroup ?? undefined,
      timeoutMs: channel.timeoutMs,
    });
    const items = Array.isArray(pricing?.data) ? pricing.data : [];
    const p = items.find((item: Record<string, unknown>) => String(item.model ?? '') === model.newapiModelName);
    if (!p) continue;
    await prisma.aiModel.update({
      where: { id: model.id },
      data: {
        modelRatio: String(p.model_ratio ?? model.modelRatio),
        completionRatio: String(p.completion_ratio ?? model.completionRatio),
        modelPrice: String(p.model_price ?? model.modelPrice),
        quotaType: Number(p.quota_type ?? model.quotaType),
        groupRatio: String(p.group_ratio ?? model.groupRatio),
      },
    });
    synced += 1;
  }
  return { synced };
}

export async function testModelAvailability() {
  return { ok: true, message: 'reserved for future implementation' };
}
