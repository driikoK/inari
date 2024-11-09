import { ANIME_TYPE, MEMBER_ROLE, SEASON } from '@members/enums/types.enum';

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

export interface ITracksWithPagination {
  data: ITrack[];
  total: number;
  page: number;
  perPage: number;
}
