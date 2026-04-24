import { z } from 'zod';
import { deleteConversation, updateConversation } from '@/services/conversation.service';
import { requireUser } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const patchSchema = z.object({ title: z.string().min(1).max(200).optional(), systemPrompt: z.string().max(5000).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const input = patchSchema.parse(await req.json());
    return ok(await updateConversation(id, user.id, input));
  } catch (e) {
    return fail(sanitizeError(e), 'UPDATE_CONVERSATION_FAILED', 400);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteConversation(id, user.id);
    return ok(true, 'deleted');
  } catch (e) {
    return fail(sanitizeError(e), 'DELETE_CONVERSATION_FAILED', 400);
  }
}
