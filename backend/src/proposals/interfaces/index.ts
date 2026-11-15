import type { Types } from 'mongoose';
import type { MEMBER_ROLE } from '../../shared/index.js';
import type { PROPOSAL_FUNDING } from '../enums/index.js';

export interface Participant {
  userName: string;
  roles: MEMBER_ROLE[];
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
  projectId?: Types.ObjectId;
  participants: Participant[];
}

export interface SeasonWithProposals extends ProposalSeason {
  proposals: Proposal[];
}
