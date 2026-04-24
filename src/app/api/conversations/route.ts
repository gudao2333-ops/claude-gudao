import { z } from 'zod';
import { requireUser } from '@/services/auth.service';
import { createConversation, listConversations } from '@/services/conversation.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  modelKey: z.string().min(1),
  systemPrompt: z.string().max(5000).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await listConversations(user.id));
  } catch (e) {
    return fail(sanitizeError(e), 'CONVERSATIONS_FAILED', 401);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = createSchema.parse(await req.json());
    return ok(await createConversation(user.id, input.title, input.modelKey, input.systemPrompt));
  } catch (e) {
    return fail(sanitizeError(e), 'CREATE_CONVERSATION_FAILED', 400);
  }
}
