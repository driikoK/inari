import * as mongoose from 'mongoose';
import { TypesEnum } from '../enums/types.enum';

export const TracksSchema = new mongoose.Schema({
  nickname: {type: String, unique: true},
  nameTitle: String,
  season: Number,
  note: String,
  type: {
    type: String,
    enum: TypesEnum,
  },
  coin: Number,
});
