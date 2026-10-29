import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MembersModule } from '../members/members.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { TracksModule } from '../tracks/tracks.module.js';
import { BudgetAuditModule } from './budget-audit.module.js';
import { BudgetController } from './budget.controller.js';
import { budgetProviders } from './budget.provider.js';
import { BudgetService } from './budget.service.js';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    TracksModule,
    MembersModule,
    BudgetAuditModule,
  ],
  providers: [BudgetService, RequestsService, ...budgetProviders],
  controllers: [BudgetController, RequestsController],
  exports: [BudgetService],
})
export class BudgetModule {}
