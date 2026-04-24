import { z } from 'zod';
import { sendChatStream } from '@/services/ai-gateway.service';
import { requireUser } from '@/services/auth.service';
import { fail, sanitizeError } from '@/lib/response';

const schema = z.object({
  modelKey: z.string().min(1),
  conversationId: z.string().optional(),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    const streamResult = await sendChatStream({ userId: user.id, ...input });

    return new Response(streamResult.stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Bill-Id': streamResult.billId,
      },
    });
  } catch (e) {
    return fail(sanitizeError(e), 'CHAT_STREAM_FAILED', 400);
  }
}
