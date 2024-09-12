import * as mongoose from 'mongoose';

export const TeamAnimeSchema = new mongoose.Schema({
  name: { type: String, unique: true },
});
