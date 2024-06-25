import * as mongoose from 'mongoose';

export const NicknameSchema = new mongoose.Schema({
  nickname: {type: String, unique: true},
  types: [String],
  coin: Number,
});
