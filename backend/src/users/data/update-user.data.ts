import { z } from 'zod';
import { ROLE } from '../enums/index.js';

export const UpdateUserData = z.object({
  role: z.enum(ROLE, { error: 'Invalid role' }).nullish(),
  email: z.email({ error: 'Неправильна пошта' }).nullish(),
  password: z.string().min(3).nullish(),
});

export type UpdateUserData = z.infer<typeof UpdateUserData>;
