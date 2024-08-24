import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { DatabaseModule } from 'src/database/database.module';
import { pollsProviders } from './polls.provider';

@Module({
  imports: [DatabaseModule],
  providers: [PollsService, ...pollsProviders],
  controllers: [PollsController],
  exports: [PollsService],
})
export class PollsModule {}
