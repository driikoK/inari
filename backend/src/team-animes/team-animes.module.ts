import { Module } from '@nestjs/common';
import { TeamAnimesService } from './team-animes.service.js';
import { teamAnimesProviders } from './team-animes.provider.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [TeamAnimesService, ...teamAnimesProviders],
  exports: [TeamAnimesService],
})
export class TeamAnimesModule {}
