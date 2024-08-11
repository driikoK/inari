import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from '../../src/config';

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: configuration.postgres.host,
  port: configuration.postgres.port,
  username: configuration.postgres.user,
  password: configuration.postgres.password,
  database: configuration.postgres.db,
  logging: false,
};

export default config;
