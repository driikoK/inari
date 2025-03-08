import * as mongoose from 'mongoose';

export const VoteSchema = new mongoose.Schema({
  userName: { type: String, ref: 'user', required: true },
  votes: [
    {
      animeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'poll_anime',
        required: true,
      },
      roles: { type: [String], required: true },
    },
  ],
});
