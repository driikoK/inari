import { z } from 'zod';

export const SignUpData = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
  email: z.email(),
});

export type SignUpData = z.infer<typeof SignUpData>;
