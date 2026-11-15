import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { budgetAuditProviders } from './budget.provider.js';
import { CrumbAuditService } from './crumb-audit.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [BudgetAuditService, CrumbAuditService, ...budgetAuditProviders],
  exports: [BudgetAuditService, CrumbAuditService],
})
export class BudgetAuditModule {}
