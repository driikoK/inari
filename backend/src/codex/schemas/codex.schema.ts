import mongoose from 'mongoose';

export const CodexSchema = new mongoose.Schema(
  {
    _id: String,
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: String,
  },
  { timestamps: true, minimize: false },
);
