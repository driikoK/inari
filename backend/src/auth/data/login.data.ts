import { z } from 'zod';

export const LoginData = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});

export type LoginData = z.infer<typeof LoginData>;
