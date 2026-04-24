import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({ role: z.enum(['user', 'admin']).optional(), status: z.enum(['active', 'banned']).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = schema.parse(await req.json());
    return ok(await prisma.user.update({ where: { id }, data }));
  } catch (e) {
    return fail(sanitizeError(e), 'UPDATE_USER_FAILED', 400);
  }
}
