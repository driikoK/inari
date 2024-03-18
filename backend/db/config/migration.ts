import { DataSource } from 'typeorm';
import configuration from '../../src/config';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configuration.host,
  port: configuration.port,
  username: configuration.user,
  password: configuration.password,
  database: configuration.db,
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
