import { MEMBER_ROLE, SEASON, ANIME_TYPE } from '../../shared/index.js';

export interface Multipliers {
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
  isGuest: boolean;
}

export interface ITrack extends Multipliers {
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
