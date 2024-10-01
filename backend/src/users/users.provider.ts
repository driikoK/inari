import { Mongoose } from 'mongoose';
import { NicknameSchema } from './schemas/nickname.schemas';

export const userProviders = [
  {
    provide: 'NICKNAME_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('Nickname', NicknameSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
