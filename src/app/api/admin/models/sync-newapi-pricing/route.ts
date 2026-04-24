import { syncNewApiPricing } from '@/services/model.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function POST() {
  try {
    await requireAdmin();
    return ok(await syncNewApiPricing());
  } catch (e) {
    return fail(sanitizeError(e), 'SYNC_PRICING_FAILED', 400);
  }
}
