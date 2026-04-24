import { BalanceLogType, Prisma, RedeemCodeStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { moneyToDecimal, safeDecimal } from '@/lib/decimal';

function buildCode() {
  const token = nanoid(12).toUpperCase();
  return `GD-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

export async function redeemCode(code: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.redeemCode.findUnique({ where: { code } });
    if (!row) throw new Error('REDEEM_CODE_INVALID');

    if (row.expiredAt && row.expiredAt.getTime() < Date.now()) {
      if (row.status === RedeemCodeStatus.unused) {
        await tx.redeemCode.update({ where: { id: row.id }, data: { status: RedeemCodeStatus.expired } });
      }
      throw new Error('REDEEM_CODE_EXPIRED');
    }

    if (row.status === RedeemCodeStatus.disabled) {
      throw new Error('REDEEM_CODE_DISABLED');
    }

    if (row.status === RedeemCodeStatus.used) {
      throw new Error('REDEEM_CODE_ALREADY_USED');
    }

    if (row.status !== RedeemCodeStatus.unused) {
      throw new Error('REDEEM_CODE_UNAVAILABLE');
    }

    await tx.$queryRaw`SELECT id FROM "RedeemCode" WHERE id = ${row.id} FOR UPDATE`;
    const locked = await tx.redeemCode.findUniqueOrThrow({ where: { id: row.id } });
    if (locked.status !== RedeemCodeStatus.unused) {
      throw new Error('REDEEM_CODE_ALREADY_USED');
    }

    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const amount = safeDecimal(row.amount);
    const balanceBefore = safeDecimal(user.balance);
    const balanceAfter = balanceBefore.add(amount);

    const usedAt = new Date();
    await tx.redeemCode.update({
      where: { id: row.id },
      data: {
        status: RedeemCodeStatus.used,
        usedByUserId: userId,
        usedAt,
      },
    });

    await tx.user.update({ where: { id: userId }, data: { balance: balanceAfter.toString() } });

    await tx.balanceLog.create({
      data: {
        userId,
        redeemCodeId: row.id,
        type: BalanceLogType.redeem,
        amount: amount.toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        remark: `兑换码 ${code}`,
      },
    });

    return {
      success: true,
      amount: row.amount,
      balance: balanceAfter,
      usedAt,
    };
  });
}

export async function createRedeemCode(input: {
  code?: string;
  amount: Prisma.Decimal | number | string;
  batchNo?: string;
  expiredAt?: Date;
  remark?: string;
  createdByUserId?: string;
}) {
  const code = input.code ?? buildCode();
  return prisma.redeemCode.create({
    data: {
      code,
      amount: moneyToDecimal(input.amount).toString(),
      batchNo: input.batchNo,
      expiredAt: input.expiredAt,
      remark: input.remark,
      createdByUserId: input.createdByUserId,
    },
  });
}

export async function batchCreateRedeemCodes(input: {
  count: number;
  amount: Prisma.Decimal | number | string;
  batchNo?: string;
  expiredAt?: Date;
  remark?: string;
  createdByUserId?: string;
}) {
  const count = Math.min(Math.max(input.count, 1), 5000);
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(buildCode());
  }

  const created = await prisma.$transaction(
    [...codes].map((code) =>
      prisma.redeemCode.create({
        data: {
          code,
          amount: moneyToDecimal(input.amount).toString(),
          batchNo: input.batchNo,
          expiredAt: input.expiredAt,
          remark: input.remark,
          createdByUserId: input.createdByUserId,
        },
      }),
    ),
  );
  return created;
}

export async function listRedeemCodes(input: {
  page?: number;
  pageSize?: number;
  status?: RedeemCodeStatus;
  batchNo?: string;
  code?: string;
  usedByUserId?: string;
}) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const where: Prisma.RedeemCodeWhereInput = {
    status: input.status,
    batchNo: input.batchNo,
    code: input.code ? { contains: input.code, mode: 'insensitive' } : undefined,
    usedByUserId: input.usedByUserId,
  };

  const [items, total] = await Promise.all([
    prisma.redeemCode.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.redeemCode.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function disableRedeemCode(id: string) {
  const row = await prisma.redeemCode.findUniqueOrThrow({ where: { id } });
  if (row.status !== RedeemCodeStatus.unused) {
    throw new Error('ONLY_UNUSED_CAN_DISABLE');
  }
  return prisma.redeemCode.update({ where: { id }, data: { status: RedeemCodeStatus.disabled } });
}

export async function exportRedeemCodes(batchNo?: string) {
  const rows = await prisma.redeemCode.findMany({ where: batchNo ? { batchNo } : undefined, orderBy: { createdAt: 'desc' } });
  const header = 'code,amount,status,expiredAt,remark';
  const body = rows
    .map((r) => `${r.code},${r.amount},${r.status},${r.expiredAt?.toISOString() ?? ''},"${(r.remark ?? '').replaceAll('"', '""')}"`)
    .join('\n');
  return `${header}\n${body}`;
}
