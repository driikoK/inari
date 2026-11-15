import { z } from 'zod';
import { MEMBER_KIND, MEMBER_ROLE, SEASON } from '../../shared/index.js';

export const UNMARKED_KIND = 'unmarked';

export const MemberFilterData = z.object({
  id: z.string().optional(),
  role: z.enum(MEMBER_ROLE, { error: 'Invalid role' }).optional(),
  kind: z
    .enum([MEMBER_KIND.TEAM, MEMBER_KIND.GUEST, UNMARKED_KIND], {
      error: 'Invalid kind',
    })
    .optional(),
  season: z.enum(SEASON, { error: 'Invalid season' }).optional(),
  year: z.coerce.number().optional(),
});

export type MemberFilterData = z.infer<typeof MemberFilterData>;
