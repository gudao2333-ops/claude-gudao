import { listBills } from '@/services/bill.service';
import { requireUser } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 20);
    const result = await listBills(user.id, page, pageSize);

    return ok({
      ...result,
      items: result.items.map((bill) => ({
        id: bill.id,
        requestId: bill.requestId,
        modelKey: bill.modelKey,
        promptTokens: bill.promptTokens,
        completionTokens: bill.completionTokens,
        totalTokens: bill.totalTokens,
        userCostCny: bill.userCostCny,
        status: bill.status,
        createdAt: bill.createdAt,
        settledAt: bill.settledAt,
      })),
    });
  } catch (e) {
    return fail(sanitizeError(e), 'BILLS_FAILED', 400);
  }
}
