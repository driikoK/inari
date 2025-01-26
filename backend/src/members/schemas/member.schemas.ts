import * as mongoose from 'mongoose';

export const MemberSchema = new mongoose.Schema(
  {
    nickname: { type: String, unique: true },
    types: [String],
    coins: Number,
    seasons: [{ season: String, year: Number, coins: Number }],
  },
  { timestamps: true },
);
