import { listMessages } from '@/services/message.service';
import { requireUser } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await listMessages(id, user.id));
  } catch (e) {
    return fail(sanitizeError(e), 'MESSAGES_FAILED', 400);
  }
}
