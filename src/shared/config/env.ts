import { z } from 'zod';

const envSchema = z.object({
  MODE: z.enum(['development', 'staging', 'production', 'test']),
  VITE_API_BASE_URL: z.string().url().default('https://api-staging.avating.com'),
  VITE_API_MODE: z.enum(['mock', 'local', 'staging', 'production']).default('mock'),
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
