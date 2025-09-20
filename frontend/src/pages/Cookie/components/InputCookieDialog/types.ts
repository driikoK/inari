import { ANIME_TYPE } from '@/types';

interface Multipliers {
  isOngoing: boolean;
  isPriority: boolean;
  isInTime: boolean;
}

export interface MemberInfo {
  nickname: string;
  coins: number;
  typeRole: string;
  isGuest: boolean;
}

export interface BasicTrackProps {
  titleName: string;
  episode: string;
  onClose: () => void;
  animeType: ANIME_TYPE;
  season: string;
  year: string;
  duration?: number;
}

export interface CreateTrackType extends Multipliers {
  membersInfo: MemberInfo[];
  currentEpisode: number;
  nameTitle: string;
  titleType: string;
  year: number;
  season: string;
  note: string;
  isGiveEditorCoins?: boolean;
  isGiveTypesetterCoins?: boolean;
  username: string;
  isSubsOnly?: boolean;
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
    fixers: FieldFormValue[];
    /* Actually this role can be not required with type NotRequiredFieldFormValue,
    but if add the type then form resolver will throw a type error.
    */
    roleBreaker: FieldFormValue;
    releasers: FieldFormValue[];
    typesetter?: NotRequiredFieldFormValue | null;
  };
  note?: string;
  isGiveEditorCoins?: boolean;
  isGiveTypesetterCoins?: boolean;
  isLastEpisode?: boolean;
}

export interface CreateTrackWithSubsOnlyFormValues
  extends Omit<CreateTrackFormValues, 'membersInfo' | 'isLastEpisode'> {
  membersInfo: {
    director: FieldFormValue;
    sub: FieldFormValue;
    editor?: NotRequiredFieldFormValue | null;
    releasers: FieldFormValue[];
    typesetter?: NotRequiredFieldFormValue | null;
  };
}

export interface ChooseAnimeFormValues {
  titleName: string;
  episode: number;
  animeType: string;
  season: string;
  year: string;
  duration?: number;
  isSubsOnly?: boolean;
}
