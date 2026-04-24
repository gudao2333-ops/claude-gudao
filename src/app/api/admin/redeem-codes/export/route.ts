import { exportRedeemCodes } from '@/services/redeem-code.service';
import { requireAdmin } from '@/services/auth.service';
import { fail, sanitizeError } from '@/lib/response';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const pick = (key: string) => {
      const v = searchParams.get(key)?.trim();
      return v ? v : undefined;
    };
    const csv = await exportRedeemCodes({
      status: pick('status') as 'unused' | 'used' | 'disabled' | 'expired' | undefined,
      batchNo: pick('batchNo'),
      code: pick('code'),
      usedByUserId: pick('usedByUserId'),
      usedByEmail: pick('usedByEmail'),
      amount: pick('amount'),
      createdAtFrom: pick('createdAtFrom'),
      createdAtTo: pick('createdAtTo'),
      expiredAtFrom: pick('expiredAtFrom'),
      expiredAtTo: pick('expiredAtTo'),
    });
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="redeem-codes.csv"',
      },
    });
  } catch (e) {
    return fail(sanitizeError(e), 'EXPORT_REDEEM_CODE_FAILED', 400);
  }
}
