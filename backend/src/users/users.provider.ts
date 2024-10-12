import { Mongoose } from 'mongoose';
import { UsersSchema } from './schemas/users.schema';

export const usersProviders = [
  {
    provide: 'USER_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('User', UsersSchema, 'users'),
    inject: ['DATABASE_CONNECTION'],
  },
];
