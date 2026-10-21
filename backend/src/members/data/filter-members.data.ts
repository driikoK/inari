import { z } from 'zod';
import { MEMBER_ROLE, SEASON } from '../../shared/index.js';

export const MemberFilterData = z.object({
  id: z.string().optional(),
  role: z.enum(MEMBER_ROLE, { error: 'Invalid role' }).optional(),
  season: z.enum(SEASON, { error: 'Invalid season' }).optional(),
  year: z.coerce.number().optional(),
});

export type MemberFilterData = z.infer<typeof MemberFilterData>;
