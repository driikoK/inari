import { Mongoose } from 'mongoose';
import { VoteSchema } from './schemas/vote.schema';
import { AnimeSchema } from './schemas/anime.schema';

export const pollsProviders = [
  {
    provide: 'VOTE_MODEL',
    useFactory: (mongoose: Mongoose) => mongoose.model('Vote', VoteSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'ANIME_MODEL',
    useFactory: (mongoose: Mongoose) => mongoose.model('Anime', AnimeSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
