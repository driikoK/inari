export interface ValuesType {
  main: TrackType;
  dubs: string[];
  isFast: boolean;
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
}

export interface MemberInfo {
  nickname: string;
  nameTitle: string;
  coin: number;
  typeRole: string;
  currentEpisode: number;
  isGuest: boolean;
}

export interface TrackType {
  [key: string]: MemberInfo;
}

export interface CreateTrackType {
  membersInfo: MemberInfo[];
  isFast: boolean;
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
}

export interface CofType {
  sub: number;
  dub: number;
  sound: number;
  additional: number;
}

export interface CoinsType {
  type: string;
  coin: number;
  maxAdditionalOnRole: number;
  bonusDirector: number;
}

export enum AnimeTypeEnum {
  NONE = 'none',
  FILM = 'film',
  SERIES = 'inTimeStandardAnime',
  SHORT_FILM = 'shortFilm',
}

export enum DubStatusEnum {
  KB = 'кб',
  COOKIE = 'крихти',
}

export interface FormErrorsType {
  main: string;
  bonus: string;
}
