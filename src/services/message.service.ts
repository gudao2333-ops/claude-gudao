import { prisma } from '@/lib/prisma';

export async function listMessages(conversationId: string, userId: string) {
  await prisma.conversation.findFirstOrThrow({ where: { id: conversationId, userId } });
  return prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } });
}

export async function createMessage(data: {
  conversationId: string;
  userId: string;
  role: string;
  content: string;
  modelKey: string;
  billId?: string;
}) {
  return prisma.message.create({ data });
}
