import { requireAdmin } from '@/services/auth.service';
import { testConnection } from '@/services/newapi.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function POST() {
  try {
    await requireAdmin();
    return ok(await testConnection());
  } catch (e) {
    return fail(sanitizeError(e), 'NEWAPI_TEST_FAILED', 400);
  }
}
