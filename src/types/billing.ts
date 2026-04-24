import type { BillingMode } from '@prisma/client';
import type Decimal from 'decimal.js';

export type NormalizedUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  cacheWriteTokens: number;
  nonCachedPromptTokens: number;
  reasoningTokens: number;
  imageTokens: number;
  audioInputTokens: number;
  audioOutputTokens: number;
  rawUsage: unknown;
  isEstimated: boolean;
};

export type BillResult = {
  quota: Decimal;
  costCny: Decimal;
  userCostCny: Decimal;
  profitCny: Decimal;
  normalizedUsage: NormalizedUsage;
  isEstimated: boolean;
  billingMode: BillingMode;
};
