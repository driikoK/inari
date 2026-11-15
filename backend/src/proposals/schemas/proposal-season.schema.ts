import mongoose from 'mongoose';

export const ProposalSeasonSchema = new mongoose.Schema(
  {
    season: { type: String, required: true },
    year: { type: Number, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ProposalSeasonSchema.index({ season: 1, year: 1 }, { unique: true });
