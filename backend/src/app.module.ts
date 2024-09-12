import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { SeedModule } from './seeds/seed.module';
import { UserModule } from './users/users.module';
import { PollsModule } from './polls/polls.module';
import { TeamAnimesModule } from './team-animes/team-animes.module';

@Module({
  imports: [
    CommandModule,
    SeedModule,
    UserModule,
    PollsModule,
    TeamAnimesModule,
  ],
})
export class AppModule {}
