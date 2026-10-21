import { z } from 'zod';

export const SeasonStateData = z.object({
  isClosed: z.boolean(),
});

export type SeasonStateData = z.infer<typeof SeasonStateData>;
