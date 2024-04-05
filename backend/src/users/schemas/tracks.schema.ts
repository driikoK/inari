import * as mongoose from 'mongoose';
import { TypesEnum } from '../enums/types.enum';

export const TracksSchema = new mongoose.Schema({
  nickname: String,
  nameTitle: String,
  type: {
    type: String,
    enum: TypesEnum,
  },
  coin: Number,
});
