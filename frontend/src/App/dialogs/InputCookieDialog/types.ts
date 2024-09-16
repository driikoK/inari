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
  coins: number;
  typeRole: string;
  isGuest: boolean;
}

export interface TrackType {
  [key: string]: MemberInfo;
}

export interface CreateTrackType extends Multipliers {
  membersInfo: MemberInfo[];
  currentEpisode: number;
  nameTitle: string;
  titleType: string;
}

export interface CofType {
  sub: number;
  dub: number;
  sound: number;
  additional: number;
}

export enum ANIME_TYPE {
  NONE = 'none',
  FILM = 'film',
  SERIES = 'series',
  SHORT_FILM = 'shortFilm',
}

export enum DUB_COIN_VALUE {
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

export interface NotRequiredFieldFormValue extends Partial<FieldFormValue> {}

export interface CreateTrackFormValues extends Multipliers {
  membersInfo: {
    sound: FieldFormValue;
    director: FieldFormValue;
    sub: FieldFormValue;
    editor?: NotRequiredFieldFormValue | null;
    dubs: FieldFormValue[];
    fixer: FieldFormValue;
    roleBreaker: FieldFormValue;
    releasers: FieldFormValue[];
    another?: NotRequiredFieldFormValue | null;
  };
  note?: string;
}
