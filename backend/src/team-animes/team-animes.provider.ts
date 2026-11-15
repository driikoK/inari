import { Mongoose } from 'mongoose';
import { TeamAnimeSchema } from './schemas/team-anime.schema.js';

export const teamAnimesProviders = [
  {
    provide: 'TEAM_ANIME_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('TeamAnime', TeamAnimeSchema, 'team_animes'),
    inject: ['DATABASE_CONNECTION'],
  },
];
