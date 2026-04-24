import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RedeemCodeStatus } from '@prisma/client';

const { tx, prismaMock } = vi.hoisted(() => {
  const txLocal = {
    redeemCode: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    balanceLog: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  };

  const prismaLocal = {
    $transaction: vi.fn(async (fn: (t: typeof txLocal) => Promise<unknown>) => fn(txLocal)),
    redeemCode: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  };

  return { tx: txLocal, prismaMock: prismaLocal };
});

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import { redeemCode, disableRedeemCode } from '@/services/redeem-code.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('redeem code service', () => {
  it('rejects repeated redeem', async () => {
    tx.redeemCode.findUnique.mockResolvedValue({ id: 'r1', status: RedeemCodeStatus.used });
    await expect(redeemCode('X', 'u1')).rejects.toThrow('REDEEM_CODE_ALREADY_USED');
  });

  it('rejects disabled code', async () => {
    tx.redeemCode.findUnique.mockResolvedValue({ id: 'r1', status: RedeemCodeStatus.disabled });
    await expect(redeemCode('X', 'u1')).rejects.toThrow('REDEEM_CODE_DISABLED');
  });

  it('rejects expired code', async () => {
    tx.redeemCode.findUnique.mockResolvedValue({
      id: 'r1',
      status: RedeemCodeStatus.unused,
      expiredAt: new Date(Date.now() - 1000),
    });
    await expect(redeemCode('X', 'u1')).rejects.toThrow('REDEEM_CODE_EXPIRED');
  });

  it('disable only unused code', async () => {
    prismaMock.redeemCode.findUniqueOrThrow.mockResolvedValue({ id: 'r1', status: RedeemCodeStatus.used });
    await expect(disableRedeemCode('r1')).rejects.toThrow('ONLY_UNUSED_CAN_DISABLE');
  });
});
