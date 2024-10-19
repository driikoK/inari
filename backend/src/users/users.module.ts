import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { usersProviders } from './users.provider';
import { DatabaseModule } from '@db/database.module';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, ...usersProviders],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
