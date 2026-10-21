import mongoose from 'mongoose';
import config from '../config/index.js';

mongoose.set('debug', true);

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(
        `mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.dbName}`,
        {
          user: config.mongo.user,
          pass: config.mongo.password,
          authSource: 'admin',
        },
      ),
  },
];
