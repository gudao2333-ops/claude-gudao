import { BalanceLogType, BillStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { moneyToDecimal, safeDecimal } from '@/lib/decimal';
import { calculateBill } from './billing.service';

export async function createPreHold(params: {
  userId: string;
  requestId: string;
  modelId: string;
  modelKey: string;
  newapiModelName: string;
  conversationId?: string;
  billingMode: 'newapi_ratio' | 'detailed_token' | 'fixed';
  quotaType: number;
  depositAmount: Prisma.Decimal | string | number;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${params.userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
    const deposit = moneyToDecimal(params.depositAmount);

    if (safeDecimal(user.balance).lt(deposit)) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    const balanceBefore = safeDecimal(user.balance);
    const frozenBefore = safeDecimal(user.frozenBalance);
    const balanceAfter = balanceBefore.sub(deposit);
    const frozenAfter = frozenBefore.add(deposit);

    await tx.user.update({
      where: { id: params.userId },
      data: { balance: balanceAfter.toString(), frozenBalance: frozenAfter.toString() },
    });

    const bill = await tx.chatBill.create({
      data: {
        requestId: params.requestId,
        userId: params.userId,
        conversationId: params.conversationId,
        modelId: params.modelId,
        modelKey: params.modelKey,
        newapiModelName: params.newapiModelName,
        billingMode: params.billingMode,
        quotaType: params.quotaType,
        depositAmount: deposit.toString(),
        status: BillStatus.pending,
      },
    });

    await tx.balanceLog.create({
      data: {
        userId: params.userId,
        billId: bill.id,
        type: BalanceLogType.pre_hold,
        amount: deposit.negated().toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        frozenBefore: frozenBefore.toString(),
        frozenAfter: frozenAfter.toString(),
        remark: `预扣账单 ${bill.requestId}`,
      },
    });

    return bill;
  });
}

export async function settleBill(params: {
  billId: string;
  usage?: unknown;
  messages?: Array<{ content?: string }>;
  answer?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const bill = await tx.chatBill.findUniqueOrThrow({ where: { id: params.billId } });
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${bill.userId} FOR UPDATE`;

    const [user, model] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: bill.userId } }),
      bill.modelId ? tx.aiModel.findUniqueOrThrow({ where: { id: bill.modelId } }) : null,
    ]);

    if (!model) throw new Error('MODEL_NOT_FOUND');

    const result = calculateBill({ model, usage: params.usage, messages: params.messages, answer: params.answer });

    const deposit = safeDecimal(bill.depositAmount);
    const userCost = safeDecimal(result.userCostCny);
    const balanceBefore = safeDecimal(user.balance);
    const frozenBefore = safeDecimal(user.frozenBalance);

    let balanceAfter = balanceBefore;
    let refundAmount = safeDecimal(0);
    let extraDeductAmount = safeDecimal(0);

    if (userCost.lt(deposit)) {
      refundAmount = deposit.sub(userCost);
      balanceAfter = balanceAfter.add(refundAmount);
      await tx.balanceLog.create({
        data: {
          userId: user.id,
          billId: bill.id,
          type: BalanceLogType.refund_hold,
          amount: refundAmount.toString(),
          balanceBefore: balanceBefore.toString(),
          balanceAfter: balanceAfter.toString(),
          frozenBefore: frozenBefore.toString(),
          frozenAfter: frozenBefore.sub(deposit).toString(),
          remark: `结算退款 ${bill.requestId}`,
        },
      });
    } else if (userCost.gt(deposit)) {
      extraDeductAmount = userCost.sub(deposit);
      if (balanceAfter.lt(extraDeductAmount)) {
        throw new Error('INSUFFICIENT_BALANCE_FOR_EXTRA_DEDUCT');
      }
      balanceAfter = balanceAfter.sub(extraDeductAmount);
      await tx.balanceLog.create({
        data: {
          userId: user.id,
          billId: bill.id,
          type: BalanceLogType.extra_deduct,
          amount: extraDeductAmount.negated().toString(),
          balanceBefore: balanceBefore.toString(),
          balanceAfter: balanceAfter.toString(),
          frozenBefore: frozenBefore.toString(),
          frozenAfter: frozenBefore.sub(deposit).toString(),
          remark: `结算补扣 ${bill.requestId}`,
        },
      });
    }

    const finalFrozen = frozenBefore.sub(deposit);

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: balanceAfter.toString(),
        frozenBalance: finalFrozen.toString(),
      },
    });

    await tx.chatBill.update({
      where: { id: bill.id },
      data: {
        promptTokens: result.normalizedUsage.promptTokens,
        completionTokens: result.normalizedUsage.completionTokens,
        totalTokens: result.normalizedUsage.totalTokens,
        cachedTokens: result.normalizedUsage.cachedTokens,
        nonCachedPromptTokens: result.normalizedUsage.nonCachedPromptTokens,
        reasoningTokens: result.normalizedUsage.reasoningTokens,
        imageTokens: result.normalizedUsage.imageTokens,
        audioInputTokens: result.normalizedUsage.audioInputTokens,
        audioOutputTokens: result.normalizedUsage.audioOutputTokens,
        quota: result.quota.toString(),
        costCny: result.costCny.toString(),
        userCostCny: result.userCostCny.toString(),
        profitCny: result.profitCny.toString(),
        refundAmount: refundAmount.toString(),
        extraDeductAmount: extraDeductAmount.toString(),
        rawUsage: result.normalizedUsage.rawUsage as Prisma.InputJsonValue,
        status: result.isEstimated ? BillStatus.estimated : BillStatus.success,
        settledAt: new Date(),
      },
    });

    await tx.balanceLog.create({
      data: {
        userId: user.id,
        billId: bill.id,
        type: BalanceLogType.final_charge,
        amount: userCost.negated().toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        frozenBefore: frozenBefore.toString(),
        frozenAfter: finalFrozen.toString(),
        remark: `最终扣费 ${bill.requestId}`,
      },
    });

    return {
      billId: bill.id,
      userCostCny: result.userCostCny,
      refundAmount,
      extraDeductAmount,
      balance: balanceAfter,
      isEstimated: result.isEstimated,
    };
  });
}

export async function refundHold(params: { billId: string; reason?: string }) {
  return prisma.$transaction(async (tx) => {
    const bill = await tx.chatBill.findUniqueOrThrow({ where: { id: params.billId } });
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${bill.userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: bill.userId } });

    const deposit = safeDecimal(bill.depositAmount);
    const balanceBefore = safeDecimal(user.balance);
    const frozenBefore = safeDecimal(user.frozenBalance);
    const balanceAfter = balanceBefore.add(deposit);
    const frozenAfter = frozenBefore.sub(deposit);

    await tx.user.update({
      where: { id: user.id },
      data: { balance: balanceAfter.toString(), frozenBalance: frozenAfter.toString() },
    });

    await tx.chatBill.update({
      where: { id: bill.id },
      data: {
        status: BillStatus.failed,
        errorMessage: params.reason,
        refundAmount: deposit.toString(),
        settledAt: new Date(),
      },
    });

    await tx.balanceLog.create({
      data: {
        userId: user.id,
        billId: bill.id,
        type: BalanceLogType.refund_hold,
        amount: deposit.toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        frozenBefore: frozenBefore.toString(),
        frozenAfter: frozenAfter.toString(),
        remark: params.reason ?? `请求失败退款 ${bill.requestId}`,
      },
    });

    return { billId: bill.id, balance: balanceAfter };
  });
}

export async function redeemRecharge(params: { userId: string; amount: Prisma.Decimal | string | number; redeemCodeId: string; remark?: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${params.userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
    const amount = moneyToDecimal(params.amount);

    const before = safeDecimal(user.balance);
    const after = before.add(amount);
    await tx.user.update({ where: { id: user.id }, data: { balance: after.toString() } });

    await tx.balanceLog.create({
      data: {
        userId: user.id,
        redeemCodeId: params.redeemCodeId,
        type: BalanceLogType.redeem,
        amount: amount.toString(),
        balanceBefore: before.toString(),
        balanceAfter: after.toString(),
        remark: params.remark ?? '兑换码充值',
      },
    });

    return { balance: after };
  });
}

export async function adminAdjustBalance(params: {
  adminId: string;
  userId: string;
  amount: Prisma.Decimal | string | number;
  remark?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${params.userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
    const amt = moneyToDecimal(params.amount);
    const before = safeDecimal(user.balance);
    const after = before.add(amt);
    if (after.lt(0)) throw new Error('BALANCE_CANNOT_BE_NEGATIVE');

    await tx.user.update({ where: { id: user.id }, data: { balance: after.toString() } });

    await tx.balanceLog.create({
      data: {
        userId: user.id,
        type: amt.gte(0) ? BalanceLogType.admin_add : BalanceLogType.admin_reduce,
        amount: amt.toString(),
        balanceBefore: before.toString(),
        balanceAfter: after.toString(),
        remark: params.remark ?? `管理员(${params.adminId})手动调整`,
      },
    });

    return { balance: after };
  });
}
