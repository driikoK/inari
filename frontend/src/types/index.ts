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
  createdAt: string;
  updatedAt: string;
  isSubsOnly?: boolean;
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

export enum ANIME_TYPE {
  NONE = 'none',
  FILM = 'film',
  SERIES = 'series',
  SHORT_FILM = 'shortFilm',
  TRAILER = 'trailer',
}

export enum PROPOSAL_FUNDING {
  PATRON = 'patron',
  ORDER = 'order',
}

export const NO_FUNDING = 'none';

export type FundingChoice = typeof NO_FUNDING | PROPOSAL_FUNDING;

export enum TITLE_KIND {
  ONGOING = 'ongoing',
  OLD = 'old',
}

export enum PROJECT_MARK {
  ONGOING = 'ongoing',
  OLD = 'old',
  DEBT = 'debt',
}

export enum ROLES_ON_VOTE {
  DUB = 'dub',
  SUB = 'sub',
  SOUND = 'sound',
  DIRECTOR = 'director',
  FIXER = 'fixer',
  RELEASER = 'releaser',
}

export type MemberKind = 'team' | 'guest';

export interface MemberType {
  _id: string;
  nickname: string;
  types: string[];
  kind?: MemberKind | null;
  coins: number;
  seasons: { season: string; year: number; coins: number }[];
  updatedAt: string;
}
