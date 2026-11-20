import type { Types } from 'mongoose';
import type { ANIME_TYPE, MEMBER_ROLE, SEASON } from '../../shared/index.js';
import type { PROPOSAL_FUNDING } from '../../proposals/enums/index.js';
import type { PROJECT_MARK } from '../enums/index.js';

export interface ProjectParticipant {
  nickname: string;
  roles: MEMBER_ROLE[];
}

export interface Project {
  _id: Types.ObjectId;
  ukrName: string;
  romajiName: string;
  codeName?: string;
  link: string;
  posterUrl?: string;
  posterFile?: string;
  titleType: ANIME_TYPE;
  isOngoing: boolean;
  isSequel: boolean;
  funding?: PROPOSAL_FUNDING;
  startDate: string;
  endDate?: string;
  isFinished: boolean;
  isInTime: boolean;
  episodesReleased: number;
  participants: ProjectParticipant[];
}

// What the page shows: the uploaded file, else the link, else nothing
export interface ProjectView extends Project {
  mark: PROJECT_MARK;
  poster?: string;
}

// What a select needs to pick a title of a track
export interface ProjectTitle {
  _id: string;
  ukrName: string;
  romajiName: string;
  codeName?: string;
  titleType: ANIME_TYPE;
  isOngoing: boolean;
  isFinished: boolean;
  startDate: string;
  season: SEASON;
  year: number;
}

export interface SeasonStats {
  total: number;
  ongoing: number;
  old: number;
  debt: number;
  patron: number;
  order: number;
}

export interface SeasonLayout {
  season: SEASON;
  year: number;
  isCurrent: boolean;
  stats: SeasonStats;
  projects: ProjectView[];
}
