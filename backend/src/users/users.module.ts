import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { usersProviders } from './users.provider';
import { DatabaseModule } from '@db/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, ...usersProviders],
  exports: [UsersService],
})
export class UsersModule {}
