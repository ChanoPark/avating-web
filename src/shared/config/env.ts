import { z } from 'zod';

const envSchema = z.object({
  MODE: z.enum(['development', 'staging', 'production', 'test']),
  VITE_API_BASE_URL: z.string().url().default('https://api-staging.avating.com'),
  VITE_API_MODE: z.enum(['mock', 'local', 'staging', 'production']).default('mock'),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_ENV: z.enum(['staging', 'production', 'development']).default('development'),
  VITE_AMPLITUDE_KEY: z.string().optional(),
  VITE_GROWTHBOOK_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

function parseEnv(): AppEnv {
  const raw: unknown = import.meta.env;
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    // Fail fast at boot — do not silently degrade.
    throw new Error(`[env] Invalid environment configuration:\n${parsed.error.toString()}`);
  }

  return parsed.data;
}

export const env = parseEnv();
