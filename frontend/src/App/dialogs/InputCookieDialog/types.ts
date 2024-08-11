export interface ValuesType {
  main: TrackType;
  dubs: string[];
}

export interface TrackType {
  [key: string]: {
    nickname: string;
    nameTitle: string;
    coin: number;
    typeRole: string;
    currentEpisode: number;
  };
}

export interface CofType{
  sub: number,
  dub: number,
  sound: number,
  additional: number,
}

export interface CoinsType {
  type: string;
  coin: number;
  maxAdditionalOnRole: number;
  bonusDirector: number;
}

export enum AnimeStatusEnum {
  NONE = 'none',
  FILM = 'film',
  SERIES = 'inTimeStandardAnime',
}

export enum DubStatusEnum {
  KB = 'кб',
  COOKIE = 'крихти'
}

export interface FormErrorsType {
  main: string;
  bonus: string;
}
