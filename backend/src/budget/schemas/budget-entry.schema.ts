import mongoose from 'mongoose';
import {
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SUPPORT_DIRECTION,
} from '../enums/index.js';

export const BudgetEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(ENTRY_TYPE),
      default: ENTRY_TYPE.INCOME,
    },
    source: {
      type: String,
      enum: Object.values(INCOME_SOURCE),
      required: function (this: { type?: ENTRY_TYPE }) {
        return !this.type || this.type === ENTRY_TYPE.INCOME;
      },
    },
    amountKop: { type: Number, required: true },
    date: { type: String, required: true },
    season: { type: String, required: true },
    year: { type: Number, required: true },
    projectId: String,
    title: String,
    nickname: String,
    direction: { type: String, enum: Object.values(SUPPORT_DIRECTION) },
    kind: { type: String, enum: Object.values(EXPENSE_KIND) },
    section: { type: String, enum: Object.values(EXPENSE_SECTION) },
    requisite: String,
    comment: String,
    createdBy: { type: String, required: true },
    updatedBy: String,
  },
  { timestamps: true },
);

BudgetEntrySchema.index({ season: 1, year: 1 });
BudgetEntrySchema.index({ date: -1, createdAt: -1, _id: -1 });
