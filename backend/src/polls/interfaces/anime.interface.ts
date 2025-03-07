import mongoose from 'mongoose';

export interface PollAnime {
  name: string;
  link: string;
  posterUrl: string;
  isOngoing: boolean;
  isPriority: boolean;
  isDecided: boolean;
  isSponsored: boolean;
  votes: mongoose.Types.Array<mongoose.Schema.Types.ObjectId>;
  note?: string;

  getTotalVotes(): number;
}

export interface PollAnimeWithoutVotes extends Omit<PollAnime, 'votes'> {}
