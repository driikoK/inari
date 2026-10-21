import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { usersProviders } from './users.provider.js';
import { DatabaseModule } from '../database/database.module.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, ...usersProviders],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
