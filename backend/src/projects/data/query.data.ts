import { z } from 'zod';
import { SEASON } from '../../shared/index.js';

const participant = z.string().trim().max(100).optional();

// Nothing at all asks for every project, as it always did. A season needs its
// year and the other way round.
export const ProjectsQueryData = z
  .object({
    season: z.enum(SEASON, { error: 'Невідомий сезон' }).optional(),
    year: z.coerce
      .number({ error: 'Невірний рік' })
      .int('Невірний рік')
      .min(2000, 'Невірний рік')
      .max(2100, 'Невірний рік')
      .optional(),
    participant,
  })
  .refine(
    ({ season, year }) => (season === undefined) === (year === undefined),
    {
      error: 'Вкажіть сезон і рік разом',
      path: ['year'],
    },
  );

export const SeasonTabsQueryData = z.object({ participant });

export type ProjectsQueryData = z.infer<typeof ProjectsQueryData>;
export type SeasonTabsQueryData = z.infer<typeof SeasonTabsQueryData>;
