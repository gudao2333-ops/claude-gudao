import { prisma } from '@/lib/prisma';

export async function getDashboard() {
  const [users, models, bills, todayCost] = await Promise.all([
    prisma.user.count(),
    prisma.aiModel.count(),
    prisma.chatBill.count(),
    prisma.chatBill.aggregate({ _sum: { userCostCny: true } }),
  ]);

  return {
    users,
    models,
    bills,
    totalUserCostCny: todayCost._sum.userCostCny ?? 0,
  };
}
