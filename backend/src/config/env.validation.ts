import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65535).optional();

const environmentSchema = z.object({
  JWT_SECRET_KEY: z.string({ error: 'is required' }).min(1, 'is required'),
  PORT: port,
  MONGO_PORT: port,
  MONGO_HOST: z.string().optional(),
  MONGO_DATABASE: z.string().optional(),
  MONGO_USERNAME: z.string().optional(),
  MONGO_PASSWORD: z.string().optional(),
  CORS: z.string().optional(),
});

// Fails fast at startup instead of at the first request that needs a setting.
export function validate(config: Record<string, unknown>) {
  // `KEY=` in a .env file yields an empty string, which counts as "not set"
  const present = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== ''),
  );
  const result = environmentSchema.safeParse(present);

  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment variables:\n${problems.join('\n')}`);
  }

  return config;
}
