import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  aiModel: { findUnique: vi.fn() },
  user: { findUniqueOrThrow: vi.fn() },
  conversation: { findFirst: vi.fn() },
};

const createPreHold = vi.fn();
const settleBill = vi.fn();
const refundHold = vi.fn();
const chatCompletion = vi.fn();
const streamChatCompletion = vi.fn();
const createConversation = vi.fn();
const maybeAutoRenameConversation = vi.fn();
const createMessage = vi.fn();
const getChannelForModel = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/services/balance.service', () => ({ createPreHold, settleBill, refundHold }));
vi.mock('@/services/newapi.service', () => ({ chatCompletion, streamChatCompletion }));
vi.mock('@/services/conversation.service', () => ({ createConversation, maybeAutoRenameConversation }));
vi.mock('@/services/message.service', () => ({ createMessage }));
vi.mock('@/services/channel.service', () => ({ getChannelForModel }));

describe('ai gateway', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects when model disabled', async () => {
    prismaMock.aiModel.findUnique.mockResolvedValue({ enabled: false, visible: true });
    const { sendChat } = await import('@/services/ai-gateway.service');
    await expect(sendChat({ userId: 'u1', modelKey: 'm1', messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow('MODEL_UNAVAILABLE');
  });

  it('rejects when balance insufficient', async () => {
    prismaMock.aiModel.findUnique.mockResolvedValue({
      id: 'm1',
      modelKey: 'm1',
      newapiModelName: 'upstream',
      enabled: true,
      visible: true,
      billingMode: 'newapi_ratio',
      quotaType: 0,
      depositAmount: '10',
      maxOutputTokens: 100,
    });
    getChannelForModel.mockResolvedValue({ id: 'ch1', baseUrl: 'https://x', apiKey: 'sk-1', defaultGroup: 'default', timeoutMs: 10000, enabled: true });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ balance: '0' });

    const { sendChat } = await import('@/services/ai-gateway.service');
    await expect(sendChat({ userId: 'u1', modelKey: 'm1', messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow('INSUFFICIENT_BALANCE');
  });

  it('refunds when upstream call fails after prehold', async () => {
    prismaMock.aiModel.findUnique.mockResolvedValue({
      id: 'm1',
      modelKey: 'm1',
      newapiModelName: 'upstream',
      enabled: true,
      visible: true,
      billingMode: 'newapi_ratio',
      quotaType: 0,
      depositAmount: '1',
      maxOutputTokens: 100,
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ id: 'u1', balance: '100' });
    prismaMock.conversation.findFirst.mockResolvedValue({ id: 'c1' });
    getChannelForModel.mockResolvedValue({ id: 'ch1', baseUrl: 'https://x', apiKey: 'sk-1', defaultGroup: 'default', timeoutMs: 10000, enabled: true });
    createPreHold.mockResolvedValue({ id: 'b1' });
    chatCompletion.mockRejectedValue(new Error('UPSTREAM_ERROR'));

    const { sendChat } = await import('@/services/ai-gateway.service');
    await expect(sendChat({ userId: 'u1', modelKey: 'm1', conversationId: 'c1', messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow('UPSTREAM_ERROR');
    expect(refundHold).toHaveBeenCalledWith(expect.objectContaining({ billId: 'b1' }));
  });

  it('rejects when no available channel', async () => {
    prismaMock.aiModel.findUnique.mockResolvedValue({
      id: 'm1', modelKey: 'm1', newapiModelName: 'upstream', enabled: true, visible: true,
      billingMode: 'newapi_ratio', quotaType: 0, depositAmount: '1', maxOutputTokens: 100,
    });
    getChannelForModel.mockResolvedValue(null);
    const { sendChat } = await import('@/services/ai-gateway.service');
    await expect(sendChat({ userId: 'u1', modelKey: 'm1', messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow('NO_AVAILABLE_CHANNEL');
  });

  it('settles when upstream succeeds', async () => {
    prismaMock.aiModel.findUnique.mockResolvedValue({
      id: 'm1', modelKey: 'm1', newapiModelName: 'upstream', enabled: true, visible: true,
      billingMode: 'newapi_ratio', quotaType: 0, depositAmount: '1', maxOutputTokens: 100,
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ id: 'u1', balance: '100' });
    prismaMock.conversation.findFirst.mockResolvedValue({ id: 'c1' });
    getChannelForModel.mockResolvedValue({ id: 'ch1', baseUrl: 'https://x', apiKey: 'sk-1', defaultGroup: 'default', timeoutMs: 10000, enabled: true });
    createPreHold.mockResolvedValue({ id: 'b1' });
    chatCompletion.mockResolvedValue({ content: 'ok', usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
    settleBill.mockResolvedValue({ userCostCny: { toString: () => '0.1' }, balance: { toString: () => '99.9' } });

    const { sendChat } = await import('@/services/ai-gateway.service');
    const result = await sendChat({ userId: 'u1', modelKey: 'm1', conversationId: 'c1', messages: [{ role: 'user', content: 'hi' }] });
    expect(result.answer).toBe('ok');
    expect(settleBill).toHaveBeenCalled();
  });
});
