import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { MembersService } from '@members/members.service';
import { membersProviders } from '@members/members.provider';
import { DictionariesService } from '@dictionaries/dictionaries.service';
import { TracksController } from './tracks.controller';
import { TrackService } from './tracks.service';
import { tracksProviders } from './tracks.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [TracksController],
  providers: [
    TrackService,
    MembersService,
    DictionariesService,
    ...tracksProviders,
    ...membersProviders,
  ],
})
export class TracksModule {}
