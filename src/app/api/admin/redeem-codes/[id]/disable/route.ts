import { disableRedeemCode } from '@/services/redeem-code.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await disableRedeemCode(id));
  } catch (e) {
    return fail(sanitizeError(e), 'DISABLE_REDEEM_CODE_FAILED', 400);
  }
}
