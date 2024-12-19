import mongoose, { Document } from 'mongoose';

export interface IAnime extends Document {
  name: string;
  link: string;
  posterUrl: string;
  isOngoing: boolean;
  isPriority: boolean;
  isDecided: boolean;
  isSponsored: boolean;
  votes: mongoose.Types.Array<mongoose.Schema.Types.ObjectId>;

  getTotalVotes(): number;
}
