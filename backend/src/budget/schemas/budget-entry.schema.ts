import mongoose from 'mongoose';
import { ENTRY_TYPE, INCOME_SOURCE } from '../enums/index.js';

export const BudgetEntrySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, default: ENTRY_TYPE.INCOME },
    source: {
      type: String,
      required: true,
      enum: Object.values(INCOME_SOURCE),
    },
    amountKop: { type: Number, required: true },
    date: { type: String, required: true },
    season: { type: String, required: true },
    year: { type: Number, required: true },
    projectId: String,
    title: String,
    nickname: String,
    createdBy: { type: String, required: true },
    updatedBy: String,
  },
  { timestamps: true },
);

BudgetEntrySchema.index({ season: 1, year: 1 });
BudgetEntrySchema.index({ date: -1, createdAt: -1, _id: -1 });
