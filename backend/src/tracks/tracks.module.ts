import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { MembersService } from '@members/members.service';
import { membersProviders } from '@members/members.provider';
import { DictionariesService } from '@dictionaries/dictionaries.service';
import { UsersService } from '@users/users.service';
import { TracksController } from './tracks.controller';
import { TrackService } from './tracks.service';
import { tracksProviders } from './tracks.provider';
import { usersProviders } from '@users/users.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [TracksController],
  providers: [
    TrackService,
    MembersService,
    DictionariesService,
    UsersService,
    ...tracksProviders,
    ...membersProviders,
    ...usersProviders,
  ],
})
export class TracksModule {}
