import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MembersService } from './members.service.js';
import { membersProviders } from './members.provider.js';
import { MembersController } from './members.controller.js';

@Module({
  imports: [DatabaseModule],
  providers: [MembersService, ...membersProviders],
  exports: [MembersService],
  controllers: [MembersController],
})
export class MembersModule {}
