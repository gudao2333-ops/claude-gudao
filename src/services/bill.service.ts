import { prisma } from '@/lib/prisma';

export async function listBills(userId: string, page = 1, pageSize = 20) {
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.chatBill.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.chatBill.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function listAllBills(page = 1, pageSize = 20) {
  const [items, total] = await Promise.all([
    prisma.chatBill.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.chatBill.count(),
  ]);
  return { items, total, page, pageSize };
}
