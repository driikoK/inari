import * as mongoose from 'mongoose';

export const VoteSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  anime: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true },
});
