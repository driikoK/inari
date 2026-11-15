import { Module } from '@nestjs/common';

import { BudgetAuditModule } from '../budget/budget-audit.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { MembersService } from '../members/members.service.js';
import { membersProviders } from '../members/members.provider.js';
import { DictionariesService } from '../dictionaries/dictionaries.service.js';
import { UsersService } from '../users/users.service.js';
import { TracksController } from './tracks.controller.js';
import { TrackService } from './tracks.service.js';
import { tracksProviders } from './tracks.provider.js';
import { usersProviders } from '../users/users.provider.js';

@Module({
  imports: [DatabaseModule, BudgetAuditModule, ProjectsModule],
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
  exports: [TrackService],
})
export class TracksModule {}
