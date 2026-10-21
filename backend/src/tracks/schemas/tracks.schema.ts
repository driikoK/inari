import mongoose from 'mongoose';
import { MEMBER_ROLE } from '../../shared/index.js';

export const TracksSchema = new mongoose.Schema(
  {
    nickname: String,
    nameTitle: String,
    titleType: String,
    season: String,
    year: Number,
    note: String,
    currentEpisode: Number,
    typeRole: {
      type: String,
      enum: MEMBER_ROLE,
    },
    coins: Number,
    isOngoing: Boolean,
    isPriority: Boolean,
    isInTime: Boolean,
    isGuest: Boolean,
    username: String,
    isSubsOnly: Boolean,
  },
  { timestamps: true },
);
