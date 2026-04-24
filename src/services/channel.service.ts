import { prisma } from '@/lib/prisma';
import { testConnection as testConnectionWithConfig } from './newapi.service';

function maskApiKey(apiKey: string) {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
}

function sanitizeChannel<T extends { apiKey: string }>(channel: T) {
  return { ...channel, apiKey: maskApiKey(channel.apiKey) };
}

export async function listChannels() {
  const channels = await prisma.aiChannel.findMany({ orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] });
  return channels.map(sanitizeChannel);
}

export async function createChannel(data: Parameters<typeof prisma.aiChannel.create>[0]['data']) {
  const created = await prisma.aiChannel.create({ data });
  return sanitizeChannel(created);
}

export async function updateChannel(id: string, data: Parameters<typeof prisma.aiChannel.update>[0]['data']) {
  const updated = await prisma.aiChannel.update({ where: { id }, data });
  return sanitizeChannel(updated);
}

export async function deleteChannel(id: string) {
  return prisma.aiChannel.delete({ where: { id } });
}

export async function testChannel(id: string) {
  const channel = await prisma.aiChannel.findUniqueOrThrow({ where: { id } });
  if (!channel.enabled) {
    throw new Error('CHANNEL_DISABLED');
  }
  return testConnectionWithConfig({
    baseUrl: channel.baseUrl,
    apiKey: channel.apiKey,
    group: channel.defaultGroup ?? undefined,
    timeoutMs: channel.timeoutMs,
  });
}

export async function getChannelForModel(modelId: string, channelId?: string | null) {
  if (channelId) {
    const bound = await prisma.aiChannel.findUnique({ where: { id: channelId } });
    if (bound?.enabled) return bound;
    if (bound && !bound.enabled) throw new Error('CHANNEL_DISABLED');
  }

  const fallback = await prisma.aiChannel.findFirst({ where: { enabled: true }, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] });
  if (fallback) return fallback;

  const model = await prisma.aiModel.findUnique({ where: { id: modelId } });
  if (!model) throw new Error('MODEL_UNAVAILABLE');
  return null;
}
