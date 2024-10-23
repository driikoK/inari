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

export interface TrackType {
  _id: string;
  nickname: string;
  nameTitle: string;
  season: string;
  currentEpisode: number;
  note?: string;
  coins: number;
  typeRole: string;
  year: number;
  titleType: string;
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
  isGuest: boolean;
  username: string;
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

export enum DUB_COIN_VALUE {
  KB = 'кб',
  COOKIE = 'крихти',
}

export enum ANIME_TYPE {
  NONE = 'none',
  FILM = 'film',
  SERIES = 'series',
  SHORT_FILM = 'shortFilm',
}

export interface MemberType {
  _id: string;
  nickname: string;
  types: string[];
  coins: number;
  seasons: { season: string; year: number; coins: number }[];
}
