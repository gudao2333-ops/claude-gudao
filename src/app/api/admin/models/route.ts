import { z } from 'zod';
import { createModel, getAdminModels } from '@/services/model.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({
  name: z.string().min(1),
  modelKey: z.string().min(1),
  newapiModelName: z.string().min(1),
  provider: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok(await getAdminModels());
  } catch (e) {
    return fail(sanitizeError(e), 'MODELS_FAILED', 400);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const input = schema.parse(await req.json());
    return ok(await createModel(input));
  } catch (e) {
    return fail(sanitizeError(e), 'CREATE_MODEL_FAILED', 400);
  }
}
