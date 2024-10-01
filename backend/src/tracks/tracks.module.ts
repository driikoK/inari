import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { UserService } from '@users/users.service';
import { SettingsService } from '@users/settings.service';
import { userProviders } from '@users/users.provider';
import { TracksController } from './tracks.controller';
import { TrackService } from './tracks.service';
import { tracksProviders } from './tracks.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [TracksController],
  providers: [
    TrackService,
    UserService,
    SettingsService,
    ...tracksProviders,
    ...userProviders,
  ],
})
export class TracksModule {}
