import { Mongoose } from 'mongoose';
import { NicknameSchema } from './schemas/nickname.schemas';
import { TracksSchema } from './schemas/tracks.schema';

export const userProviders = [
  {
    provide: 'NICKNAME_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('Nickname', NicknameSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'TRACK_MODEL',
    useFactory: (mongoose: Mongoose) => mongoose.model('Track', TracksSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
