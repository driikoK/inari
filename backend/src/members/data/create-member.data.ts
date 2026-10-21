import { z } from 'zod';

export const CreateMemberData = z.object({
  nickname: z.string().min(1),
  types: z.array(z.string()),
  coins: z
    .int('Coins must be an integer')
    .min(0, 'Coins must be at least 0')
    .nullish(),
});

export type CreateMemberData = z.infer<typeof CreateMemberData>;
