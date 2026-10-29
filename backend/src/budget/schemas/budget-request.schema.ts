import mongoose from 'mongoose';
import { EXPENSE_KIND, REQUEST_STATUS } from '../enums/index.js';

const PartSchema = new mongoose.Schema(
  {
    season: { type: String, required: true },
    year: { type: Number, required: true },
    crumbs: { type: Number, required: true },
    coefficient: { type: Number, required: true },
    amountKop: { type: Number, required: true },
  },
  { _id: false },
);

export const BudgetRequestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.OPEN,
    },
    username: { type: String, required: true },
    nickname: { type: String, required: true },
    groupId: { type: String, required: true },
    kind: { type: String, required: true, enum: Object.values(EXPENSE_KIND) },
    isOrder: { type: Boolean, required: true },
    crumbs: Number,
    amountKop: Number,
    projectId: String,
    title: String,
    requisite: String,
    comment: String,
    closedAt: Date,
    closedBy: String,
    closedDay: String,
    paidKop: Number,
    parts: [PartSchema],
  },
  { timestamps: true },
);

BudgetRequestSchema.index({ status: 1, createdAt: -1 });
BudgetRequestSchema.index({ username: 1, createdAt: -1 });
BudgetRequestSchema.index({ nickname: 1, status: 1 });
