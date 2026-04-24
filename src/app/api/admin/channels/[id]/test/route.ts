import { requireAdmin } from '@/services/auth.service';
import { testChannel } from '@/services/channel.service';
import { fail, ok, sanitizeError } from '@/lib/response';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await testChannel(id));
  } catch (e) {
    return fail(sanitizeError(e), 'TEST_CHANNEL_FAILED', 400);
  }
}
