import { DataSource } from 'typeorm';
import configuration from '../../src/config';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configuration.postgres.host,
  port: configuration.postgres.port,
  username: configuration.postgres.user,
  password: configuration.postgres.password,
  database: configuration.postgres.db,
  logging: false,
  entities: [__dirname + '/../../dist/src/**/*.entity.js'],
  migrations: [__dirname + '/../migrations/*.ts'],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  // cli: {
  //   migrationsDir: 'db/migrations',
  // },
});

export default AppDataSource;
