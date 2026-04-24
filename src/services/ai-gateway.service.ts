import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { safeDecimal } from '@/lib/decimal';
import { chatCompletion, streamChatCompletion } from './newapi.service';
import { createPreHold, refundHold, settleBill } from './balance.service';
import { createConversation, maybeAutoRenameConversation } from './conversation.service';
import { createMessage } from './message.service';
import { getChannelForModel } from './channel.service';

async function getOrCreateConversation(userId: string, conversationId: string | undefined, modelKey: string, title?: string) {
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    if (existing) return existing;
  }
  return createConversation(userId, title ?? '新对话', modelKey);
}

export async function sendChat(input: {
  userId: string;
  modelKey: string;
  messages: Array<{ role: string; content: string }>;
  conversationId?: string;
}) {
  const model = await prisma.aiModel.findUnique({ where: { modelKey: input.modelKey } });
  if (!model || !model.enabled || !model.visible) throw new Error('MODEL_UNAVAILABLE');

  const channel = await getChannelForModel(model.id, model.channelId);
  if (!channel) throw new Error('NO_AVAILABLE_CHANNEL');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
  if (safeDecimal(user.balance).lt(model.depositAmount)) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  const conversation = await getOrCreateConversation(
    input.userId,
    input.conversationId,
    input.modelKey,
    input.messages[0]?.content?.slice(0, 20),
  );

  const requestId = nanoid();
  const bill = await createPreHold({
    userId: input.userId,
    requestId,
    modelId: model.id,
    modelKey: model.modelKey,
    newapiModelName: model.newapiModelName,
    conversationId: conversation.id,
    billingMode: model.billingMode,
    quotaType: model.quotaType,
    depositAmount: model.depositAmount,
  });

  try {
    const completion = await chatCompletion({
      model: model.newapiModelName,
      messages: input.messages,
      max_tokens: model.maxOutputTokens,
    }, {
      baseUrl: channel.baseUrl,
      apiKey: channel.apiKey,
      group: channel.defaultGroup ?? undefined,
      timeoutMs: channel.timeoutMs,
    });

    const settled = await settleBill({
      billId: bill.id,
      usage: completion.usage,
      messages: input.messages,
      answer: completion.content,
    });

    const userMsg = input.messages[input.messages.length - 1];
    if (userMsg?.role === 'user') {
      await maybeAutoRenameConversation(conversation.id, input.userId, userMsg.content);
      await createMessage({
        conversationId: conversation.id,
        userId: input.userId,
        role: 'user',
        content: userMsg.content,
        modelKey: model.modelKey,
        billId: bill.id,
      });
    }

    await createMessage({
      conversationId: conversation.id,
      userId: input.userId,
      role: 'assistant',
      content: completion.content,
      modelKey: model.modelKey,
      billId: bill.id,
    });

    return {
      answer: completion.content,
      conversationId: conversation.id,
      billId: bill.id,
      userCostCny: settled.userCostCny.toString(),
      balance: settled.balance.toString(),
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
    };
  } catch (error) {
    await refundHold({ billId: bill.id, reason: (error as Error).message });
    throw error;
  }
}

export async function sendChatStream(input: {
  userId: string;
  modelKey: string;
  messages: Array<{ role: string; content: string }>;
  conversationId?: string;
}) {
  const model = await prisma.aiModel.findUnique({ where: { modelKey: input.modelKey } });
  if (!model || !model.enabled || !model.visible) throw new Error('MODEL_UNAVAILABLE');
  const channel = await getChannelForModel(model.id, model.channelId);
  if (!channel) throw new Error('NO_AVAILABLE_CHANNEL');

  const conversation = await getOrCreateConversation(input.userId, input.conversationId, model.modelKey);
  const requestId = nanoid();
  const bill = await createPreHold({
    userId: input.userId,
    requestId,
    modelId: model.id,
    modelKey: model.modelKey,
    newapiModelName: model.newapiModelName,
    conversationId: conversation.id,
    billingMode: model.billingMode,
    quotaType: model.quotaType,
    depositAmount: model.depositAmount,
  });

  const userMsg = input.messages[input.messages.length - 1];
  if (userMsg?.role === 'user') {
    await maybeAutoRenameConversation(conversation.id, input.userId, userMsg.content);
    await createMessage({
      conversationId: conversation.id,
      userId: input.userId,
      role: 'user',
      content: userMsg.content,
      modelKey: model.modelKey,
      billId: bill.id,
    });
  }

  try {
    const { stream, getFinal } = await streamChatCompletion({
      model: model.newapiModelName,
      messages: input.messages,
      max_tokens: model.maxOutputTokens,
    }, {
      baseUrl: channel.baseUrl,
      apiKey: channel.apiKey,
      group: channel.defaultGroup ?? undefined,
      timeoutMs: channel.timeoutMs,
    });

    const reader = stream.getReader();
    let finished = false;

    const wrappedStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            if (!finished) {
              finished = true;
              const { content, usage } = getFinal();
              const settled = await settleBill({ billId: bill.id, usage, messages: input.messages, answer: content });
              await createMessage({
                conversationId: conversation.id,
                userId: input.userId,
                role: 'assistant',
                content,
                modelKey: model.modelKey,
                billId: bill.id,
              });
              const billingEvent = `data: ${JSON.stringify({ type: 'billing', billId: bill.id, userCostCny: settled.userCostCny.toString(), balance: settled.balance.toString() })}\n\n`;
              controller.enqueue(new TextEncoder().encode(billingEvent));
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done', billId: bill.id })}\n\n`));
            }
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch (error) {
          if (!finished) {
            finished = true;
            await refundHold({ billId: bill.id, reason: (error as Error).message });
          }
          controller.error(error);
        }
      },
      async cancel(reason) {
        if (!finished) {
          finished = true;
          await refundHold({ billId: bill.id, reason: `stream canceled: ${String(reason ?? '')}` });
        }
      },
    });

    return { stream: wrappedStream, billId: bill.id, conversationId: conversation.id };
  } catch (error) {
    await refundHold({ billId: bill.id, reason: (error as Error).message });
    throw error;
  }
}
