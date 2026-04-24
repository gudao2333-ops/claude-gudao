import { z } from 'zod';
import { batchCreateRedeemCodes } from '@/services/redeem-code.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({
  count: z.number().int().min(1).max(5000),
  amount: z.union([z.string(), z.number()]),
  batchNo: z.string().optional(),
  expiredAt: z.string().datetime().optional(),
  remark: z.string().optional(),
  codePrefix: z.string().max(12).optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const input = schema.parse(await req.json());
    return ok(
      await batchCreateRedeemCodes({
        ...input,
        expiredAt: input.expiredAt ? new Date(input.expiredAt) : undefined,
        createdByUserId: admin.id,
        codePrefix: input.codePrefix,
      }),
    );
  } catch (e) {
    return fail(sanitizeError(e), 'BATCH_REDEEM_CODE_FAILED', 400);
  }
}
