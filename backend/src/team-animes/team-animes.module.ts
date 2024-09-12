import { Module } from '@nestjs/common';
import { TeamAnimesController } from './team-animes.controller';
import { TeamAnimesService } from './team-animes.service';
import { teamAnimesProviders } from './team-animes.provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TeamAnimesController],
  providers: [TeamAnimesService, ...teamAnimesProviders],
})
export class TeamAnimesModule {}
