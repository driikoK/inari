import { z } from 'zod';
import { MEMBER_KIND } from '../../shared/index.js';

export const CreateMemberData = z.object({
  nickname: z.string().min(1),
  types: z.array(z.string()),
  kind: z.enum(MEMBER_KIND, {
    error: 'Вкажіть, чи це гість, чи учасник команди',
  }),
  coins: z
    .int('Coins must be an integer')
    .min(0, 'Coins must be at least 0')
    .nullish(),
});

export type CreateMemberData = z.infer<typeof CreateMemberData>;
