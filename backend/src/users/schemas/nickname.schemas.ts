import * as mongoose from 'mongoose';

export const NicknameSchema = new mongoose.Schema({
  name: String,
  types: [String],
  coin: Number,
});
