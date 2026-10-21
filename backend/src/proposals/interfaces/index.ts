import type { Types } from 'mongoose';
import type { PROPOSAL_FUNDING, ProposalRole } from '../enums/index.js';

export interface Participant {
  userName: string;
  roles: ProposalRole[];
}

export interface ProposalSeason {
  _id: Types.ObjectId;
  season: string;
  year: number;
  isClosed: boolean;
}

export interface Proposal {
  _id: Types.ObjectId;
  seasonId: Types.ObjectId;
  ukrName: string;
  romajiName: string;
  link: string;
  posterUrl?: string;
  note?: string;
  isOngoing: boolean;
  isSequel: boolean;
  funding?: PROPOSAL_FUNDING;
  participants: Participant[];
}

export interface SeasonWithProposals extends ProposalSeason {
  proposals: Proposal[];
}
