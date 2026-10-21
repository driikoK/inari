import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller.js';
import { PollsService } from './polls.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { pollsProviders } from './polls.provider.js';

@Module({
  imports: [DatabaseModule],
  providers: [PollsService, ...pollsProviders],
  controllers: [PollsController],
  exports: [PollsService],
})
export class PollsModule {}
