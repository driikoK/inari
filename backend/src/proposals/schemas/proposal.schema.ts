import mongoose from 'mongoose';

export const ProposalSchema = new mongoose.Schema(
  {
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'proposal_season',
      required: true,
      index: true,
    },
    ukrName: { type: String, required: true },
    romajiName: { type: String, required: true },
    link: { type: String, required: true },
    posterUrl: String,
    note: String,
    isOngoing: { type: Boolean, required: true },
    isSequel: { type: Boolean, default: false },
    funding: String,
    participants: [
      {
        _id: false,
        userName: { type: String, required: true },
        roles: { type: [String], required: true },
      },
    ],
  },
  { timestamps: true },
);
