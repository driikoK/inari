import { Document, Types } from 'mongoose';

export interface IVote extends Document {
  userName: string;
  anime: Types.ObjectId;
}
