import { updateAnnouncement, deleteAnnouncement } from '@/services/announcement.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await updateAnnouncement(id, await req.json()));
  } catch (e) {
    return fail(sanitizeError(e), 'UPDATE_ANNOUNCEMENT_FAILED', 400);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteAnnouncement(id);
    return ok(true, 'deleted');
  } catch (e) {
    return fail(sanitizeError(e), 'DELETE_ANNOUNCEMENT_FAILED', 400);
  }
}
