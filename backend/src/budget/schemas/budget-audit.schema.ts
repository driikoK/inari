import mongoose from 'mongoose';
import { AUDIT_UNIT } from '../enums/index.js';

export const BudgetAuditSchema = new mongoose.Schema(
  {
    operationId: { type: String, required: true },
    seq: { type: Number, required: true },
    at: { type: Date, required: true },
    day: { type: String, required: true },
    kind: { type: String, required: true },
    actor: { type: String, required: true },
    operationDescription: { type: String, required: true },
    unit: { type: String, default: AUDIT_UNIT.MONEY },
    subjectKind: { type: String, required: true },
    subjectKey: { type: String, required: true },
    subjectLabel: { type: String, required: true },
    deltaKop: Number,
    balanceAfterKop: Number,
    deltaCrumbs: Number,
    balanceAfterCrumbs: Number,
    seasonBalanceAfterCrumbs: Number,
    season: { type: String, required: true },
    year: { type: Number, required: true },
    entryId: String,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  { versionKey: false },
);

BudgetAuditSchema.index({ operationId: 1, seq: 1 });
BudgetAuditSchema.index({ at: -1 });
BudgetAuditSchema.index({ day: -1 });
BudgetAuditSchema.index({ season: 1, year: 1 });
BudgetAuditSchema.index({ kind: 1 });
