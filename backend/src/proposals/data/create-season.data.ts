import { z } from 'zod';
import { SEASON } from '../../shared/index.js';

export const CreateSeasonData = z.object({
  season: z.enum(SEASON, { error: 'Invalid season' }),
  year: z.number().int().min(2000).max(2100),
});

export type CreateSeasonData = z.infer<typeof CreateSeasonData>;
