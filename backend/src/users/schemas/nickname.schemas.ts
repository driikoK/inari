import * as mongoose from 'mongoose';

export const NicknameSchema = new mongoose.Schema({
  nickname: String,
  types: [String],
  coin: Number,
});
