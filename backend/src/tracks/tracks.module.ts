import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { MembersService } from '@members/members.service';
import { SettingsService } from '@members/settings.service';
import { membersProviders } from '@members/members.provider';
import { TracksController } from './tracks.controller';
import { TrackService } from './tracks.service';
import { tracksProviders } from './tracks.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [TracksController],
  providers: [
    TrackService,
    MembersService,
    SettingsService,
    ...tracksProviders,
    ...membersProviders,
  ],
})
export class TracksModule {}
