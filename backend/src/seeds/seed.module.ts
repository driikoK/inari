import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';
import { MembersModule } from '@members/members.module';
import { UsersModule } from '@users/users.module';
import { PollsModule } from 'src/polls/polls.module';
import { TeamAnimesModule } from 'src/team-animes/team-animes.module';
import { TracksModule } from 'src/tracks/tracks.module';

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
