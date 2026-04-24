import { z } from 'zod';
import { requireAdmin } from '@/services/auth.service';
import { adminAdjustBalance } from '@/services/balance.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({ amount: z.union([z.number(), z.string()]), remark: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = schema.parse(await req.json());
    return ok(await adminAdjustBalance({ adminId: admin.id, userId: id, amount: input.amount, remark: input.remark }));
  } catch (e) {
    return fail(sanitizeError(e), 'ADJUST_BALANCE_FAILED', 400);
  }
}
