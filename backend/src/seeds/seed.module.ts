import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command.js';
import { MembersModule } from '../members/members.module.js';
import { UsersModule } from '../users/users.module.js';
import { PollsModule } from '../polls/polls.module.js';
import { TeamAnimesModule } from '../team-animes/team-animes.module.js';
import { TracksModule } from '../tracks/tracks.module.js';

@Module({
  imports: [
    MembersModule,
    UsersModule,
    PollsModule,
    TeamAnimesModule,
    TracksModule,
  ],
  providers: [SeedCommand],
})
export class SeedModule {}
