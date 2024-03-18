import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from '../../src/config';

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: configuration.host,
  port: configuration.port,
  username: configuration.user,
  password: configuration.password,
  database: configuration.db,
  logging: false,
};

export default config;
