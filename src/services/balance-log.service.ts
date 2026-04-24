import { prisma } from '@/lib/prisma';

export async function listBalanceLogs(userId: string, page = 1, pageSize = 20) {
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.balanceLog.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.balanceLog.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function listAllBalanceLogs(page = 1, pageSize = 20) {
  const [items, total] = await Promise.all([
    prisma.balanceLog.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.balanceLog.count(),
  ]);
  return { items, total, page, pageSize };
}
