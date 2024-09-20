export type TAnime = {
  _id: string;
  name: string;
  link: string;
  posterUrl: string;
  isOngoing: boolean;
  isPriority: boolean;
  isDecided: boolean;
  isSponsored: boolean;
};

export type TResultAnime = {
  anime: TAnime & {
    votes: {
      _id: string;
      userName: string;
    }[];
  };
  voteCount: number;
};

export interface ValuesType {
  main: TracksType;
  bonus: TracksType;
  dubs: string[];
}

export interface TracksType {
  [key: string]: {
    nickname: string;
    nameTitle: string;
    coins: number;
    typeRole: string;
    currentEpisode: number;
  };
}

export interface TrackType {
  _id: string;
  nickname: string;
  nameTitle: string;
  season: number;
  currentEpisode: number;
  note?: string;
  coins: number;
  typeRole: string;
}

export interface CofType {
  sub: number;
  dub: number;
  sound: number;
  additional: number;
  fastMultiplier: number;
}

export interface CoinsType {
  type: string;
  coins: number;
  sub: number;
  editor: number;
  dub: {
    double: number;
    multi: number;
  };
  fixer: number;
  roleBreaker: number;
  sound: number;
  releaser: number;
  director: number;
  another: number;
}

export enum AnimeStatusEnum {
  NONE = 'none',
  FILM = 'film',
  STANDARD = 'inTimeStandardAnime',
  DELAY = 'delayStandardAnime',
}

export enum DUB_COIN_VALUE {
  KB = 'кб',
  COOKIE = 'крихти',
}

export interface FormErrorsType {
  main: string;
  bonus: string;
}

export interface UserType {
  _id: string;
  nickname: string;
  types: string[];
  coins: number;
}
