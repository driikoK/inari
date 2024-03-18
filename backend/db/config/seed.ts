import config from './index';

export = {
  ...config,
  entities: [__dirname + '/../../src/**/*.entity.ts'],
  migrations: [__dirname + '/../seeds/*.ts', __dirname + '/../seeds/*.js'],
  cli: {
    migrationsDir: 'db/seeds',
  },
};
