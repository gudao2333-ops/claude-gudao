import { z } from 'zod';
import { redeemCode } from '@/services/redeem-code.service';
import { requireUser } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({ code: z.string().min(1) });

function mapRedeemError(message: string) {
  if (message.includes('REDEEM_CODE_INVALID')) return '兑换码无效';
  if (message.includes('REDEEM_CODE_ALREADY_USED')) return '兑换码已使用';
  if (message.includes('REDEEM_CODE_DISABLED')) return '兑换码已禁用';
  if (message.includes('REDEEM_CODE_EXPIRED')) return '兑换码已过期';
  if (message.includes('REDEEM_CODE_UNAVAILABLE')) return '兑换码不可用';
  return '兑换失败，请稍后重试';
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    const result = await redeemCode(input.code, user.id);
    return ok({ amount: result.amount, balance: result.balance.toString() }, '兑换成功');
  } catch (e) {
    const msg = sanitizeError(e);
    return fail(mapRedeemError(msg), 'REDEEM_FAILED', 400);
  }
}
