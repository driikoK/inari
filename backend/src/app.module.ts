import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { SeedModule } from './seeds/seed.module';
import { UserModule } from './users/users.module';
import { PollsModule } from './polls/polls.module';

@Module({
  imports: [CommandModule, SeedModule, UserModule, PollsModule],
})
export class AppModule {}
