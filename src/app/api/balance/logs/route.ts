import { listBalanceLogs } from '@/services/balance-log.service';
import { requireUser } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 20);
    return ok(await listBalanceLogs(user.id, page, pageSize));
  } catch (e) {
    return fail(sanitizeError(e), 'BALANCE_LOGS_FAILED', 400);
  }
}
