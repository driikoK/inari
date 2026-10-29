import { Mongoose } from 'mongoose';
import { BudgetAuditSchema } from './schemas/budget-audit.schema.js';
import { BudgetEntrySchema } from './schemas/budget-entry.schema.js';
import { BudgetRequestSchema } from './schemas/budget-request.schema.js';

export const budgetAuditProviders = [
  {
    provide: 'BUDGET_AUDIT_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('BudgetAudit', BudgetAuditSchema, 'budget_audit'),
    inject: ['DATABASE_CONNECTION'],
  },
];

export const budgetProviders = [
  {
    provide: 'BUDGET_ENTRY_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('BudgetEntry', BudgetEntrySchema, 'budget_entries'),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'BUDGET_REQUEST_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('BudgetRequest', BudgetRequestSchema, 'budget_requests'),
    inject: ['DATABASE_CONNECTION'],
  },
];
