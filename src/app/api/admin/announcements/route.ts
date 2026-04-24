import { z } from 'zod';
import { createAnnouncement, listAnnouncements } from '@/services/announcement.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['global', 'dashboard', 'maintenance', 'model']),
  enabled: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok(await listAnnouncements());
  } catch (e) {
    return fail(sanitizeError(e), 'ANNOUNCEMENTS_FAILED', 400);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const input = schema.parse(await req.json());
    return ok(await createAnnouncement(input));
  } catch (e) {
    return fail(sanitizeError(e), 'CREATE_ANNOUNCEMENT_FAILED', 400);
  }
}
