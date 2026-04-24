import { syncNewApiPricing } from '@/services/model.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    return ok(await syncNewApiPricing(body.channelId));
  } catch (e) {
    return fail(sanitizeError(e), 'SYNC_PRICING_FAILED', 400);
  }
}
