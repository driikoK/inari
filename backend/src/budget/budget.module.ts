import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { TracksModule } from '../tracks/tracks.module.js';
import { BudgetAuditModule } from './budget-audit.module.js';
import { BudgetController } from './budget.controller.js';
import { budgetProviders } from './budget.provider.js';
import { BudgetService } from './budget.service.js';

@Module({
  imports: [DatabaseModule, ProjectsModule, TracksModule, BudgetAuditModule],
  providers: [BudgetService, ...budgetProviders],
  controllers: [BudgetController],
  exports: [BudgetService],
})
export class BudgetModule {}
