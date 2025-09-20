import { ANIME_TYPE } from '@/types';
import { FieldFormValue, MemberInfo, NotRequiredFieldFormValue } from '../types';

export const checkIsOnlyOneEpisode = (animeType: ANIME_TYPE) => {
  return animeType === ANIME_TYPE.SHORT_FILM || animeType === ANIME_TYPE.FILM;
};

export const finalizeMembersInfoArray = (
  membersInfo: Record<string, NotRequiredFieldFormValue | FieldFormValue | FieldFormValue[] | null>
) => {
  return Object.entries(membersInfo).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((member) => ({
        ...member,
        typeRole: key,
        coins: Number(member.coins),
      }));
    }

    if (!value?.hasOwnProperty('nickname')) return [];

    return value?.nickname !== '' ? { ...value, typeRole: key, coins: Number(value?.coins) } : [];
  }) as MemberInfo[];
};
