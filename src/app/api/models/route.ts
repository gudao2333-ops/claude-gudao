import { getVisibleModelsForUser } from '@/services/model.service';
import { ok, fail, sanitizeError } from '@/lib/response';

export async function GET() {
  try {
    const data = await getVisibleModelsForUser();
    return ok(
      data.map((m) => ({ id: m.id, name: m.name, modelKey: m.modelKey, description: m.description, maxOutputTokens: m.maxOutputTokens })),
    );
  } catch (e) {
    return fail(sanitizeError(e), 'MODELS_FAILED', 400);
  }
}
