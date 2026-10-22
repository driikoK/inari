import { z } from 'zod';
import { SEASON } from '../../shared/index.js';

// Loose: the frontend sends seasons back exactly as the database returned them (with `_id`)
const MemberSeason = z.looseObject({
  season: z.enum(SEASON),
  year: z.number(),
  coins: z.number(),
});

export const UpdateMemberData = z.object({
  nickname: z.string(),
  types: z.array(z.string()).nullish(),
  coins: z
    .number({ error: 'Coins must be a number' })
    .min(0, 'Coins must be at least 0'),
  seasons: z.array(MemberSeason).nullish(),
});

export type UpdateMemberData = z.infer<typeof UpdateMemberData>;
