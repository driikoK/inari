import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command.js';
import { BudgetModule } from '../budget/budget.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { MembersModule } from '../members/members.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { ProposalsModule } from '../proposals/proposals.module.js';
import { TeamAnimesModule } from '../team-animes/team-animes.module.js';
import { TracksModule } from '../tracks/tracks.module.js';

@Module({
  imports: [
    DatabaseModule,
    BudgetModule,
    MembersModule,
    UsersModule,
    ProposalsModule,
    ProjectsModule,
    TeamAnimesModule,
    TracksModule,
  ],
  providers: [SeedCommand],
})
export class SeedModule {}
