import { z } from 'zod';

export const ForgotPasswordData = z.object({
  email: z.email(),
});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordData>;
