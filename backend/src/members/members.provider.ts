import { Mongoose } from 'mongoose';
import { MemberSchema } from './schemas/member.schemas.js';

export const membersProviders = [
  {
    provide: 'MEMBER_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('Nickname', MemberSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
