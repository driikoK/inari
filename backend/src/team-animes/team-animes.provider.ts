import { Mongoose } from 'mongoose';
import { TeamAnimeSchema } from '../team-animes/schemas/team-anime.schema';

export const teamAnimesProviders = [
  {
    provide: 'TEAM_ANIME_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('TeamAnime', TeamAnimeSchema, 'team_animes'),
    inject: ['DATABASE_CONNECTION'],
  },
];
