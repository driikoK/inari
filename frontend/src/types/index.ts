export type TAnime = {
  _id: string,
  name: string,
  link: string,
  posterUrl: string,
  isOngoing: boolean,
  isPriority: boolean,
}

export type TResultAnime = {
  anime: TAnime & {
    votes: {
      _id: string,
      userName: string,
    }[],
  },
  voteCount: number,
}

export interface ValuesType {
  main: TracksType;
  bonus: TracksType;
  dubs: string[];
}

export interface TracksType {
  [key: string]: {
    nickname: string;
    nameTitle: string;
    coin: number;
    typeRole: string;
    currentEpisode: number;
  };
}

export interface TrackType {
  _id: string
  nickname: string;
  nameTitle: string;
  season: number;
  currentEpisode: number;
  note: string | null;
  coin: number;
  typeRole: string;
}

export interface CofType{
  sub: number,
  dub: number,
  sound: number,
  additional: number,
  fastMultiplier: number,
}

export interface CoinsType {
  type: string;
  coin: number;
  maxAdditionalOnRole: number,
  bonusDirector: number;
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

export interface UserType {
  _id: string,
  nickname: string,
  types: string[],
  coin: number,
  __v: number
}