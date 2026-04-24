import { describe, expect, it } from 'vitest';
import { calculateBill } from '@/services/billing.service';

const baseModel = {
  id: 'm1',
  name: '模型',
  modelKey: 'mk',
  newapiModelName: 'upstream',
  provider: null,
  description: null,
  enabled: true,
  visible: true,
  sort: 0,
  billingMode: 'newapi_ratio',
  quotaType: 0,
  modelRatio: '1',
  completionRatio: '2',
  groupRatio: '1',
  modelPrice: '0',
  quotaToCnyRate: '0.001',
  inputPricePer1kCny: '1',
  outputPricePer1kCny: '2',
  cacheReadPricePer1kCny: '0.5',
  cacheWritePricePer1kCny: '0.5',
  reasoningPricePer1kCny: '1',
  imageInputPricePer1kCny: '1',
  audioInputPricePer1kCny: '1',
  audioOutputPricePer1kCny: '1',
  fixedCostCny: '1',
  fixedPriceCny: '2',
  profitRate: '1.5',
  depositAmount: '0.2',
  minChargeAmount: '0.001',
  maxContextTokens: 32000,
  maxOutputTokens: 4096,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('billing service', () => {
  it('calculates newapi_ratio correctly', () => {
    const result = calculateBill({
      model: { ...baseModel, billingMode: 'newapi_ratio', completionRatio: '2' } as never,
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });

    expect(result.quota.toNumber()).toBe(200);
    expect(result.costCny.toNumber()).toBe(0.2);
    expect(result.userCostCny.toNumber()).toBe(0.3);
  });

  it('calculates detailed_token correctly', () => {
    const result = calculateBill({
      model: { ...baseModel, billingMode: 'detailed_token', profitRate: '2' } as never,
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 1000,
        total_tokens: 2000,
        prompt_tokens_details: { cached_tokens: 200, cache_write_tokens: 100, image_tokens: 50, audio_tokens: 50 },
        completion_tokens_details: { reasoning_tokens: 100, audio_tokens: 100 },
      },
    });

    expect(result.costCny.toNumber()).toBeGreaterThan(2);
    expect(result.userCostCny.toNumber()).toBe(result.costCny.mul(2).toNumber());
  });

  it('calculates fixed correctly', () => {
    const result = calculateBill({
      model: { ...baseModel, billingMode: 'fixed', fixedPriceCny: '3', fixedCostCny: '1.2' } as never,
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    expect(result.userCostCny.toNumber()).toBe(3);
    expect(result.costCny.toNumber()).toBe(1.2);
    expect(result.profitCny.toNumber()).toBe(1.8);
  });

  it('falls back to estimated when usage missing', () => {
    const result = calculateBill({
      model: { ...baseModel } as never,
      usage: undefined,
      messages: [{ content: 'hello world' }],
      answer: 'ok',
    });
    expect(result.isEstimated).toBe(true);
    expect(result.normalizedUsage.totalTokens).toBeGreaterThan(0);
  });
});
