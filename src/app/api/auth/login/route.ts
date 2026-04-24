import { z } from 'zod';
import { login } from '@/services/auth.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const schema = z.object({ account: z.string().min(1), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const user = await login(input);
    return ok(user, 'logged_in');
  } catch (e) {
    return fail(sanitizeError(e), 'LOGIN_FAILED', 400);
  }
}
