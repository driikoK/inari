import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import type { AppConfig } from '../config/configuration.js';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    inject: [ConfigService],
    useFactory: (
      config: ConfigService<AppConfig, true>,
    ): Promise<typeof mongoose> => {
      const { host, port, dbName, user, password } = config.get('mongo', {
        infer: true,
      });

      return mongoose.connect(`mongodb://${host}:${port}/${dbName}`, {
        user,
        pass: password,
        authSource: 'admin',
      });
    },
  },
];
