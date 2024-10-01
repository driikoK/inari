import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';
import { MembersModule } from '@members/members.module';
import { PollsModule } from 'src/polls/polls.module';

@Module({
  imports: [MembersModule, PollsModule],
  providers: [SeedCommand],
})
export class SeedModule {}
