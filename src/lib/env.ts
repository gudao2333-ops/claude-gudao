import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  APP_URL: z.string().url(),
  NEWAPI_BASE_URL: z.string().url(),
  NEWAPI_API_KEY: z.string().min(1),
  NEWAPI_DEFAULT_GROUP: z.string().min(1),
  DEFAULT_QUOTA_TO_CNY_RATE: z.string().min(1),
  DEFAULT_PROFIT_RATE: z.string().min(1),
  REDEEM_BUY_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;

export function getPublicEnv() {
  return {
    APP_URL: env.APP_URL,
    REDEEM_BUY_URL: env.REDEEM_BUY_URL,
  };
}
