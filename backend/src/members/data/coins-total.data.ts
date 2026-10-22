import { z } from 'zod';
import { SEASON } from '../../shared/index.js';

export const CoinsTotalFilterData = z
  .object({
    season: z.enum(SEASON, { error: 'Invalid season' }).optional(),
    year: z.coerce.number().int().optional(),
    includeGuests: z
      .stringbool({ error: 'includeGuests має бути true або false' })
      .default(true),
  })
  .refine(({ season, year }) => !season === !year, {
    message: 'Сезон і рік вказуються разом',
    path: ['season'],
  });

export type CoinsTotalFilterData = z.infer<typeof CoinsTotalFilterData>;
