import mongoose from 'mongoose';

export const UsersSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: String,
  email: String,
  nickname: { type: String, unique: true, sparse: true },
});
