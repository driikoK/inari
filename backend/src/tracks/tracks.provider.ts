import { Mongoose } from 'mongoose';

import { TracksSchema } from './schemas/tracks.schema';

export const tracksProviders = [
  {
    provide: 'TRACK_MODEL',
    useFactory: (mongoose: Mongoose) => mongoose.model('Track', TracksSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
