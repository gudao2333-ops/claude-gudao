import { z } from 'zod';
import { requireAdmin } from '@/services/auth.service';
import { createChannel, listChannels } from '@/services/channel.service';
import { fail, ok, sanitizeError } from '@/lib/response';

const schema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  defaultGroup: z.string().optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
  timeoutMs: z.number().int().min(1000).max(120000).optional(),
  remark: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok(await listChannels());
  } catch (e) {
    return fail(sanitizeError(e), 'CHANNELS_FAILED', 400);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const input = schema.parse(await req.json());
    return ok(await createChannel(input));
  } catch (e) {
    return fail(sanitizeError(e), 'CREATE_CHANNEL_FAILED', 400);
  }
}
