import { MEMBER_ROLE, SEASON, ANIME_TYPE } from '../../shared/index.js';

export interface Multipliers {
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
  isGuest: boolean;
}

export interface ITrack extends Multipliers {
  projectId?: string;
  nickname: string;
  nameTitle: string;
  titleType: ANIME_TYPE;
  season: SEASON;
  year: number;
  note: string;
  currentEpisode: number;
  typeRole: MEMBER_ROLE;
  coins: number;
}

// The tracks written under one title text, to move that title to a project
export interface TitleGroup {
  nameTitle: string;
  titleType: ANIME_TYPE;
  season: SEASON;
  year: number;
  isOngoing: boolean;
  maxEpisode: number;
  firstAt: Date;
  lastAt: Date;
  tracks: number;
  unlinked: number;
  // A project some of its tracks are linked to already
  projectId?: string;
  // Who worked on it in which role, and on how many tracks
  members: { nickname: string; role: MEMBER_ROLE; tracks: number }[];
}

export interface SeasonCoins {
  season: SEASON;
  year: number;
  coins: number;
}

export interface NicknameCoins extends SeasonCoins {
  nickname: string;
}

export interface ITracksWithPagination {
  data: ITrack[];
  total: number;
  page: number;
  perPage: number;
}
