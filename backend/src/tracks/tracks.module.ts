import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { TracksController } from './tracks.controller';
import { TrackService } from './tracks.service';
import { tracksProviders } from './tracks.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [TracksController],
  providers: [TrackService, ...tracksProviders],
})
export class TeamAnimesModule {}
