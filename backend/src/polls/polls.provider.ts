import { Mongoose } from 'mongoose';
import { VoteSchema, AnimeSchema } from './schemas';

export const pollsProviders = [
  {
    provide: 'VOTE_MODEL',
    useFactory: (mongoose: Mongoose) => mongoose.model('Vote', VoteSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'POLL_ANIME_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('poll_anime', AnimeSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
