import { exportRedeemCodes } from '@/services/redeem-code.service';
import { requireAdmin } from '@/services/auth.service';
import { fail, sanitizeError } from '@/lib/response';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const batchNo = searchParams.get('batchNo') ?? undefined;
    const csv = await exportRedeemCodes(batchNo);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="redeem-codes-${batchNo ?? 'all'}.csv"`,
      },
    });
  } catch (e) {
    return fail(sanitizeError(e), 'EXPORT_REDEEM_CODE_FAILED', 400);
  }
}
