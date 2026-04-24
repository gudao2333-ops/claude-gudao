import { listAllBills } from '@/services/bill.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 20);
    return ok(await listAllBills(page, pageSize));
  } catch (e) {
    return fail(sanitizeError(e), 'ADMIN_BILLS_FAILED', 400);
  }
}
