interface Multipliers {
  isFast: boolean;
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
}

export interface ValuesType extends Multipliers {
  main: TrackType;
  dubs: string[];
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

export interface CreateTrackType extends Multipliers {
  membersInfo: MemberInfo[];
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

export interface FieldFormValue {
  nickname: string;
  coins: string;
  isGuest?: boolean;
}

export interface CreateTrackFormValues extends Multipliers {
  sound: FieldFormValue;
  director: FieldFormValue;
  sub: FieldFormValue;
  editor: FieldFormValue;
  dubs: FieldFormValue[];
  fixer: FieldFormValue;
  roleBreaker?: FieldFormValue;
  releasers: FieldFormValue[];
  another?: FieldFormValue;
  note?: string;
}
