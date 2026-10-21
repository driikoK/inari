import { z } from 'zod';

export const CreateTeamAnimeData = z.object({
  name: z.string(),
});

export type CreateTeamAnimeData = z.infer<typeof CreateTeamAnimeData>;
