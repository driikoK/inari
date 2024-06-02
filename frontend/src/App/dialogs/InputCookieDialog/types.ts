export interface ValuesType {
  main: TrackType;
  bonus: TrackType;
  dubs: number[];
}

export interface TrackType {
  [key: string]: {
    nickname: string;
    nameTitle: string;
    coin: number;
    typeRole: string;
  };
}

export interface CofType{
  sub: number,
  dub: number,
  sound: number,
}

export interface CoinsType {
  type: string;
  coin: number;
  coinBonus: number;
  maxBonusOnRole: number;
  maxBonusForOthers: number;
  maxBonusForMainRoles: number;
  BonusDirector: number;
}

export enum AnimeStatusEnum {
  NONE = 'none',
  FILM = 'film',
  STANDART = 'inTimeStandardAnime',
  DELAY = 'delayStandardAnime',
}

export enum DubStatusEnum {
  KB = 'кб',
  COOKIE = 'крихти'
}

export interface FormErrorsType {
  main: string;
  bonus: string;
}
