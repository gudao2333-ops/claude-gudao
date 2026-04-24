import { requireAdmin } from '@/services/auth.service';
import { syncNewApiPricing } from '@/services/model.service';
import { fail, ok, sanitizeError } from '@/lib/response';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await syncNewApiPricing(id));
  } catch (e) {
    return fail(sanitizeError(e), 'SYNC_CHANNEL_PRICING_FAILED', 400);
  }
}
