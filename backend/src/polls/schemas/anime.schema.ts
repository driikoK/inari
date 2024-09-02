import * as mongoose from 'mongoose';

export const AnimeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  posterUrl: { type: String, required: true },
  isOngoing: { type: Boolean, required: true },
  isPriority: { type: Boolean, required: true },
  isDecided: { type: Boolean, required: true },
  isSponsored: { type: Boolean, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }],
});

AnimeSchema.methods.getTotalVotes = function () {
  return this.votes.length;
};
