import { z } from 'zod';
import { ROLES_ON_VOTE } from '../enums/index.js';

const AnimeRoles = z.object({
  animeId: z.string(),
  roles: z.array(z.enum(ROLES_ON_VOTE)).max(6, 'Обрано забагато ролей'),
});

export const VoteData = z.object({
  votes: z.array(AnimeRoles).max(10, 'Обрано більше 10 аніме'),
});

export type VoteData = z.infer<typeof VoteData>;
