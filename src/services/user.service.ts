import { prisma } from '@/lib/prisma';

export async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      nickname: true,
      avatar: true,
      balance: true,
      frozenBalance: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listUsers(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.user.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.user.count(),
  ]);
  return { items, total, page, pageSize };
}
