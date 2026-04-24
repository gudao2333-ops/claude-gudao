import { logout } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

export async function POST() {
  try {
    await logout();
    return ok(true, 'logged_out');
  } catch (e) {
    return fail(sanitizeError(e), 'LOGOUT_FAILED', 400);
  }
}
