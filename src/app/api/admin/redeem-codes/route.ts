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

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    return ok(
      await listRedeemCodes({
        page: Number(searchParams.get('page') ?? 1),
        pageSize: Number(searchParams.get('pageSize') ?? 20),
        status: (searchParams.get('status') as 'unused' | 'used' | 'disabled' | 'expired' | null) ?? undefined,
        batchNo: searchParams.get('batchNo') ?? undefined,
        code: searchParams.get('code') ?? undefined,
        usedByUserId: searchParams.get('usedByUserId') ?? undefined,
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
