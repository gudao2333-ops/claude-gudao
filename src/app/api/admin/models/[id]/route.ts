import { updateModel, deleteModel } from '@/services/model.service';
import { requireAdmin } from '@/services/auth.service';
import { ok, fail, sanitizeError } from '@/lib/response';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  modelKey: z.string().min(1).optional(),
  channelId: z.string().min(1).optional(),
  newapiModelName: z.string().min(1).optional(),
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    return ok(await updateModel(id, patchSchema.parse(await req.json())));
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
