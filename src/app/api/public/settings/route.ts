import { getPublicSettings } from '@/services/settings.service';
import { fail, ok, sanitizeError } from '@/lib/response';

export async function GET() {
  try {
    const settings = await getPublicSettings();
    return ok(settings);
  } catch (e) {
    return fail(sanitizeError(e), 'SETTINGS_FAILED', 400);
  }
}
