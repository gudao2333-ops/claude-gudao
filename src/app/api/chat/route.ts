import { z } from 'zod';
import { sendChat } from '@/services/ai-gateway.service';
import { requireUser } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const schema = z.object({
  modelKey: z.string().min(1),
  conversationId: z.string().optional(),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    return ok(await sendChat({ userId: user.id, ...input }));
  } catch (e) {
    return fail(sanitizeError(e), 'CHAT_FAILED', 400);
  }
}
