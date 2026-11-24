import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PostersModule } from '../posters/posters.module.js';
import { ProposalsModule } from '../proposals/proposals.module.js';
import { tracksProviders } from '../tracks/tracks.provider.js';
import { ProjectsController } from './projects.controller.js';
import { projectsProviders } from './projects.provider.js';
import { ProjectsService } from './projects.service.js';

@Module({
  imports: [DatabaseModule, PostersModule, ProposalsModule],
  providers: [ProjectsService, ...projectsProviders, ...tracksProviders],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
