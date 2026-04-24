import { z } from 'zod';
import { register } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const schema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  nickname: z.string().max(50).optional(),
});

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const user = await register(input);
    return ok(user, 'registered');
  } catch (e) {
    return fail(sanitizeError(e), 'REGISTER_FAILED', 400);
  }
}
