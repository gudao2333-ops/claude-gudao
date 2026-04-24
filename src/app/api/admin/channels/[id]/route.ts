import { z } from 'zod';
import { requireAdmin } from '@/services/auth.service';
import { deleteChannel, updateChannel } from '@/services/channel.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const schema = z.object({
  name: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  defaultGroup: z.string().optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
  timeoutMs: z.number().int().min(1000).max(120000).optional(),
  remark: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await updateChannel(id, schema.parse(await req.json())));
  } catch (e) {
    return fail(sanitizeError(e), 'UPDATE_CHANNEL_FAILED', 400);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteChannel(id);
    return ok(true, 'deleted');
  } catch (e) {
    return fail(sanitizeError(e), 'DELETE_CHANNEL_FAILED', 400);
  }
}
