import { requireAdmin } from '@/services/auth.service';
import { getDashboard } from '@/services/admin.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function GET() {
  try {
    await requireAdmin();
    return ok(await getDashboard());
  } catch (e) {
    return fail(sanitizeError(e), 'FORBIDDEN', 403);
  }
}
