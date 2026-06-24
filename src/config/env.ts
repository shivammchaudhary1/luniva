import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
});

const parsedEnvironment = publicEnvironmentSchema.safeParse({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Invalid public environment configuration: ${details}`);
}

export const env = Object.freeze({
  appEnvironment: parsedEnvironment.data.EXPO_PUBLIC_APP_ENV,
});
