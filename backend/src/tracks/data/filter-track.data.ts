import { z } from 'zod';
import { MEMBER_ROLE, SEASON } from '../../shared/index.js';

export const FilterTrackData = z.object({
  nickname: z.string().optional(),
  season: z.enum(SEASON).optional(),
  year: z.coerce.number().optional(),
  nameTitle: z.string().optional(),
  typeRole: z.enum(MEMBER_ROLE).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).default(10),
});

export type FilterTrackData = z.infer<typeof FilterTrackData>;
