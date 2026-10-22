import mongoose from 'mongoose';

export const ProjectSchema = new mongoose.Schema(
  {
    ukrName: { type: String, required: true },
    romajiName: { type: String, required: true },
    codeName: String,
    link: { type: String, required: true },
    posterUrl: String,
    titleType: { type: String, required: true },
    isOngoing: { type: Boolean, required: true },
    isSequel: { type: Boolean, default: false },
    funding: String,
    startDate: { type: String, required: true },
    endDate: String,
    isFinished: { type: Boolean, default: false },
    isInTime: { type: Boolean, default: false },
    episodesReleased: { type: Number, default: 0 },
    participants: [
      {
        _id: false,
        nickname: { type: String, required: true },
        roles: { type: [String], required: true },
      },
    ],
  },
  { timestamps: true },
);
