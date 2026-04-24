import { z } from 'zod';
import { getAdminSettings, setSetting } from '@/services/settings.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.record(z.string(), z.string());

export async function GET() {
  try {
    await requireAdmin();
    return ok(await getAdminSettings(true));
  } catch (e) {
    return fail(sanitizeError(e), 'SETTINGS_FAILED', 400);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const data = schema.parse(await req.json());
    await Promise.all(Object.entries(data).map(([key, value]) => setSetting(key, value)));
    return ok(await getAdminSettings(true));
  } catch (e) {
    return fail(sanitizeError(e), 'SETTINGS_UPDATE_FAILED', 400);
  }
}
