import { Mongoose } from 'mongoose';
import { VoteSchema, AnimeSchema } from './schemas';

export const pollsProviders = [
  {
    provide: 'VOTE_MODEL',
    useFactory: (mongoose: Mongoose) => mongoose.model('Vote', VoteSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'ANIME_FOR_VOTING_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('Anime_for_voting', AnimeSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
