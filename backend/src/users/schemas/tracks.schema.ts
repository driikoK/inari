import * as mongoose from 'mongoose';
import { MEMBER_ROLE } from '../enums/types.enum';

export const TracksSchema = new mongoose.Schema({
  nickname: String,
  nameTitle: String,
  season: String,
  year: Number,
  note: String,
  currentEpisode: Number,
  typeRole: {
    type: String,
    enum: MEMBER_ROLE,
  },
  coins: Number,
});
