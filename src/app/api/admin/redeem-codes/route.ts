import { z } from 'zod';
import { createRedeemCode, listRedeemCodes } from '@/services/redeem-code.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const createSchema = z.object({
  code: z.string().optional(),
  amount: z.union([z.string(), z.number()]),
  batchNo: z.string().optional(),
  expiredAt: z.string().datetime().optional(),
  remark: z.string().optional(),
});

function toOptional(value: string | null) {
  const v = value?.trim();
  return v ? v : undefined;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = toOptional(searchParams.get('status'));
    if (status && !['unused', 'used', 'disabled', 'expired'].includes(status)) {
      throw new Error('INVALID_STATUS');
    }
    return ok(
      await listRedeemCodes({
        page: Number(searchParams.get('page') ?? 1),
        pageSize: Number(searchParams.get('pageSize') ?? 20),
        status: status as 'unused' | 'used' | 'disabled' | 'expired' | undefined,
        batchNo: toOptional(searchParams.get('batchNo')),
        code: toOptional(searchParams.get('code')),
        usedByUserId: toOptional(searchParams.get('usedByUserId')),
        usedByEmail: toOptional(searchParams.get('usedByEmail')),
        amount: toOptional(searchParams.get('amount')),
        createdAtFrom: toOptional(searchParams.get('createdAtFrom')),
        createdAtTo: toOptional(searchParams.get('createdAtTo')),
        expiredAtFrom: toOptional(searchParams.get('expiredAtFrom')),
        expiredAtTo: toOptional(searchParams.get('expiredAtTo')),
      }),
    );
  } catch (e) {
    return fail(sanitizeError(e), 'REDEEM_CODES_FAILED', 400);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const input = createSchema.parse(await req.json());
    return ok(
      await createRedeemCode({
        ...input,
        expiredAt: input.expiredAt ? new Date(input.expiredAt) : undefined,
        createdByUserId: admin.id,
      }),
    );
  } catch (e) {
    return fail(sanitizeError(e), 'CREATE_REDEEM_CODE_FAILED', 400);
  }
}
