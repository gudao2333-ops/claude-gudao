import { updateModel, deleteModel } from '@/services/model.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await updateModel(id, await req.json()));
  } catch (e) {
    return fail(sanitizeError(e), 'UPDATE_MODEL_FAILED', 400);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteModel(id);
    return ok(true, 'deleted');
  } catch (e) {
    return fail(sanitizeError(e), 'DELETE_MODEL_FAILED', 400);
  }
}
