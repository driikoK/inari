import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProposalsModule } from '../proposals/proposals.module.js';
import { ProjectsController } from './projects.controller.js';
import { projectsProviders } from './projects.provider.js';
import { ProjectsService } from './projects.service.js';

@Module({
  imports: [DatabaseModule, ProposalsModule],
  providers: [ProjectsService, ...projectsProviders],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
