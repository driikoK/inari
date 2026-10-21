import { Module } from '@nestjs/common';
import { TeamAnimesController } from './team-animes.controller.js';
import { TeamAnimesService } from './team-animes.service.js';
import { teamAnimesProviders } from './team-animes.provider.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TeamAnimesController],
  providers: [TeamAnimesService, ...teamAnimesProviders],
  exports: [TeamAnimesService],
})
export class TeamAnimesModule {}
