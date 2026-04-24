import { prisma } from '@/lib/prisma';

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
}

export async function createConversation(userId: string, title: string, modelKey: string, systemPrompt?: string) {
  return prisma.conversation.create({ data: { userId, title, modelKey, systemPrompt } });
}

export async function updateConversation(id: string, userId: string, data: { title?: string; systemPrompt?: string }) {
  return prisma.conversation.update({ where: { id, userId }, data });
}

export async function deleteConversation(id: string, userId: string) {
  return prisma.conversation.delete({ where: { id, userId } });
}
