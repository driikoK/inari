import mongoose from 'mongoose';

export const TeamAnimeSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  // The project the title was moved to by migrate:titles
  projectId: String,
});
