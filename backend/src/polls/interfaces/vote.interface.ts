import { Document, Types } from 'mongoose';

export interface Vote extends Document {
  userName: string;
  anime: Types.ObjectId;
}
