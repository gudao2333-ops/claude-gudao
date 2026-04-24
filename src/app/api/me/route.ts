import { getMe } from '@/services/user.service';
import { requireUser } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

export async function GET() {
  try {
    const user = await requireUser();
    const me = await getMe(user.id);
    return ok(me);
  } catch (e) {
    return fail(sanitizeError(e), 'UNAUTHORIZED', 401);
  }
}
