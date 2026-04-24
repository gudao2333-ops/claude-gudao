import type { AiModel, BillingMode } from '@prisma/client';
import Decimal from 'decimal.js';
import { moneyToDecimal, safeDecimal } from '@/lib/decimal';
import type { BillResult, NormalizedUsage } from '@/types/billing';

function n(v: unknown): number {
  const num = Number(v ?? 0);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
}

export function estimateTokensFallback(messages: Array<{ content?: string }>, answer = ''): NormalizedUsage {
  const inputText = messages.map((m) => m.content ?? '').join('\n');
  const promptTokens = Math.max(1, Math.ceil(inputText.length / 4));
  const completionTokens = Math.max(1, Math.ceil(answer.length / 4));
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cachedTokens: 0,
    cacheWriteTokens: 0,
    nonCachedPromptTokens: promptTokens,
    reasoningTokens: 0,
    imageTokens: 0,
    audioInputTokens: 0,
    audioOutputTokens: 0,
    rawUsage: { source: 'estimated', inputChars: inputText.length, answerChars: answer.length },
    isEstimated: true,
  };
}

export function normalizeUsage(
  usage: unknown,
  messages: Array<{ content?: string }> = [],
  answer = '',
): NormalizedUsage {
  const u = (usage ?? {}) as Record<string, unknown>;
  if (!usage || (u.prompt_tokens == null && u.completion_tokens == null && u.total_tokens == null)) {
    return estimateTokensFallback(messages, answer);
  }

  const promptTokens = n(u.prompt_tokens);
  const completionTokens = n(u.completion_tokens);
  const totalTokens = n(u.total_tokens || promptTokens + completionTokens);
  const promptDetails = (u.prompt_tokens_details ?? {}) as Record<string, unknown>;
  const completionDetails = (u.completion_tokens_details ?? {}) as Record<string, unknown>;

  const cachedTokens = n(promptDetails.cached_tokens);
  const cacheWriteTokens = n(promptDetails.cache_write_tokens);
  const imageTokens = n(promptDetails.image_tokens);
  const audioInputTokens = n(promptDetails.audio_tokens);
  const audioOutputTokens = n(completionDetails.audio_tokens);
  const reasoningTokens = n(completionDetails.reasoning_tokens);

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    cachedTokens,
    cacheWriteTokens,
    nonCachedPromptTokens: Math.max(promptTokens - cachedTokens, 0),
    reasoningTokens,
    imageTokens,
    audioInputTokens,
    audioOutputTokens,
    rawUsage: usage,
    isEstimated: false,
  };
}

export function calculateByNewApiRatio(model: AiModel, usage: NormalizedUsage) {
  const completionRatio = safeDecimal(model.completionRatio, 1);
  const modelRatio = safeDecimal(model.modelRatio, 1);
  const groupRatio = safeDecimal(model.groupRatio, 1);
  const quotaToCnyRate = safeDecimal(model.quotaToCnyRate, 0.000015);
  const profitRate = safeDecimal(model.profitRate, 1.6);

  let quota = new Decimal(0);
  if (model.quotaType === 0) {
    quota = new Decimal(usage.promptTokens)
      .add(new Decimal(usage.completionTokens).mul(completionRatio))
      .mul(modelRatio)
      .mul(groupRatio);
  } else {
    quota = safeDecimal(model.modelPrice).mul(groupRatio).mul(500000);
  }

  const costCny = quota.mul(quotaToCnyRate);
  const userCostCny = costCny.mul(profitRate);
  return { quota, costCny, userCostCny };
}

export function calculateByDetailedToken(model: AiModel, usage: NormalizedUsage) {
  const costCny = new Decimal(usage.nonCachedPromptTokens)
    .div(1000)
    .mul(safeDecimal(model.inputPricePer1kCny))
    .add(new Decimal(usage.completionTokens).div(1000).mul(safeDecimal(model.outputPricePer1kCny)))
    .add(new Decimal(usage.cachedTokens).div(1000).mul(safeDecimal(model.cacheReadPricePer1kCny)))
    .add(new Decimal(usage.cacheWriteTokens).div(1000).mul(safeDecimal(model.cacheWritePricePer1kCny)))
    .add(new Decimal(usage.reasoningTokens).div(1000).mul(safeDecimal(model.reasoningPricePer1kCny)))
    .add(new Decimal(usage.imageTokens).div(1000).mul(safeDecimal(model.imageInputPricePer1kCny)))
    .add(new Decimal(usage.audioInputTokens).div(1000).mul(safeDecimal(model.audioInputPricePer1kCny)))
    .add(new Decimal(usage.audioOutputTokens).div(1000).mul(safeDecimal(model.audioOutputPricePer1kCny)));

  const userCostCny = costCny.mul(safeDecimal(model.profitRate, 1.6));
  return { quota: new Decimal(0), costCny, userCostCny };
}

export function calculateByFixedPrice(model: AiModel) {
  const fixedCostCny = safeDecimal(model.fixedCostCny, 0);
  const fixedPriceCny = safeDecimal(model.fixedPriceCny, 0);
  const profitRate = safeDecimal(model.profitRate, 1.6);

  const costCny = fixedCostCny;
  const userCostCny = fixedPriceCny.gt(0) ? fixedPriceCny : fixedCostCny.mul(profitRate);
  return { quota: new Decimal(0), costCny, userCostCny };
}

export function calculateBill(params: {
  model: AiModel;
  usage?: unknown;
  messages?: Array<{ content?: string }>;
  answer?: string;
}): BillResult {
  const normalizedUsage = normalizeUsage(params.usage, params.messages, params.answer);
  const billingMode = params.model.billingMode as BillingMode;

  let calc: { quota: Decimal; costCny: Decimal; userCostCny: Decimal };
  if (billingMode === 'detailed_token') {
    calc = calculateByDetailedToken(params.model, normalizedUsage);
  } else if (billingMode === 'fixed') {
    calc = calculateByFixedPrice(params.model);
  } else {
    calc = calculateByNewApiRatio(params.model, normalizedUsage);
  }

  const minCharge = safeDecimal(params.model.minChargeAmount, 0);
  const userCostCny = Decimal.max(calc.userCostCny, minCharge);
  const costCny = moneyToDecimal(calc.costCny);
  const profitCny = moneyToDecimal(userCostCny.sub(costCny));

  return {
    quota: moneyToDecimal(calc.quota),
    costCny,
    userCostCny: moneyToDecimal(userCostCny),
    profitCny,
    normalizedUsage,
    isEstimated: normalizedUsage.isEstimated,
    billingMode,
  };
}
