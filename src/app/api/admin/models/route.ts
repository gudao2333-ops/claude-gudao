import { z } from 'zod';
import { createModel, getAdminModels } from '@/services/model.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';

const schema = z.object({
  name: z.string().min(1),
  modelKey: z.string().min(1),
  channelId: z.string().min(1),
  newapiModelName: z.string().min(1),
  provider: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  visible: z.boolean().optional(),
  sort: z.number().int().optional(),
  billingMode: z.enum(['newapi_ratio', 'detailed_token', 'fixed']).optional(),
  quotaType: z.number().int().optional(),
  modelRatio: z.union([z.string(), z.number()]).optional(),
  completionRatio: z.union([z.string(), z.number()]).optional(),
  groupRatio: z.union([z.string(), z.number()]).optional(),
  modelPrice: z.union([z.string(), z.number()]).optional(),
  quotaToCnyRate: z.union([z.string(), z.number()]).optional(),
  inputPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  outputPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  cacheReadPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  cacheWritePricePer1kCny: z.union([z.string(), z.number()]).optional(),
  reasoningPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  imageInputPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  audioInputPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  audioOutputPricePer1kCny: z.union([z.string(), z.number()]).optional(),
  fixedCostCny: z.union([z.string(), z.number()]).optional(),
  fixedPriceCny: z.union([z.string(), z.number()]).optional(),
  profitRate: z.union([z.string(), z.number()]).optional(),
  depositAmount: z.union([z.string(), z.number()]).optional(),
  minChargeAmount: z.union([z.string(), z.number()]).optional(),
  maxContextTokens: z.number().int().optional(),
  maxOutputTokens: z.number().int().optional(),
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
