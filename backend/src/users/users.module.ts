import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { usersProviders } from './users.provider.js';
import { DatabaseModule } from '../database/database.module.js';
import { PollsModule } from '../polls/polls.module.js';
import { ProposalsModule } from '../proposals/proposals.module.js';
import { UsersController } from './users.controller.js';

@Global()
@Module({
  imports: [DatabaseModule, PollsModule, ProposalsModule],
  providers: [UsersService, ...usersProviders],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
