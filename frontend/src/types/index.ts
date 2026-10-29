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

export enum INCOME_SOURCE {
  BMAC = 'bmac',
  DONATELLO = 'donatello',
  TEAM_JAR = 'teamJar',
  PROJECT_JAR = 'projectJar',
  ORDER = 'order',
  LISODAR = 'lisodar',
}

export enum ENTRY_TYPE {
  INCOME = 'income',
  ALLOCATION = 'allocation',
  EXPENSE = 'expense',
}

export enum SUPPORT_DIRECTION {
  COVERS = 'covers',
  PROMOTION = 'promotion',
  ADS = 'ads',
  SITE = 'site',
  SERVER = 'server',
  BOTS = 'bots',
  TRAINING = 'training',
  EQUIPMENT = 'equipment',
  HOLIDAY = 'holiday',
  OTHER = 'other',
}

export enum EXPENSE_KIND {
  CARD = 'card',
  DONATION = 'donation',
  DEVELOPMENT = 'development',
}

export enum EXPENSE_SECTION {
  SUPPORT = 'support',
  ORDERS = 'orders',
  CRUMBS = 'crumbs',
}

export enum REQUEST_STATUS {
  OPEN = 'open',
  DONE = 'done',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum AUDIT_KIND {
  INCOME_CREATED = 'income.created',
  INCOME_UPDATED = 'income.updated',
  INCOME_DELETED = 'income.deleted',
  SUPPORT_UPDATED = 'support.updated',
  ALLOCATION_DELETED = 'allocation.deleted',
  EXPENSE_CREATED = 'expense.created',
  EXPENSE_UPDATED = 'expense.updated',
  EXPENSE_DELETED = 'expense.deleted',
  REQUEST_FULFILLED = 'request.fulfilled',
  TRACK_CREATED = 'track.created',
  TRACK_UPDATED = 'track.updated',
  TRACK_DELETED = 'track.deleted',
  MEMBER_CREATED = 'member.created',
  MEMBER_ADJUSTED = 'member.adjusted',
  CRUMBS_INITIAL = 'crumbs.initial',
}

export enum AUDIT_UNIT {
  MONEY = 'money',
  CRUMBS = 'crumbs',
}

export enum BUDGET_ERROR {
  AUDIT_NOT_SAVED = 'AUDIT_NOT_SAVED',
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

export interface CoinsTotal {
  total: number;
  unmarkedCount: number;
}

export interface MyCoins {
  nickname: string | null;
  coins: number;
  currentSeason: { season: string; year: number; coins: number };
}
