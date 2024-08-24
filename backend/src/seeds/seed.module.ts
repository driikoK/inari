import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';
import { UserModule } from 'src/users/users.module';
import { PollsModule } from 'src/polls/polls.module';

@Module({
  imports: [UserModule, PollsModule],
  providers: [SeedCommand],
})
export class SeedModule {}
