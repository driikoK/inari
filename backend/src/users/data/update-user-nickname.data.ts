import { z } from 'zod';

export const UpdateUserNicknameData = z.object({
  nickname: z.string().trim().min(1, 'Вкажіть нікнейм').nullish(),
  create: z.boolean().default(false),
});

export type UpdateUserNicknameData = z.infer<typeof UpdateUserNicknameData>;
