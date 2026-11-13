import { ANIME_TYPE } from '@/types';
import { FieldFormValue, MemberInfo, NotRequiredFieldFormValue } from '../types';

const SEASON_ORDER = ['winter', 'spring', 'summer', 'fall'];

const SEASONS_BACK = 12;

// The seasons a track can be written in, newest first: the last three years and,
// when the project began earlier, back to the season it began in
export const trackSeasons = (start: { season: string; year: number }, today: string) => {
  const [year, month] = today.split('-').map(Number);
  const last = year * SEASON_ORDER.length + Math.floor((month - 1) / 3);
  const started = start.year * SEASON_ORDER.length + SEASON_ORDER.indexOf(start.season);
  const first = Math.min(started, last - SEASONS_BACK);

  return Array.from({ length: last - first + 1 }, (_, index) => {
    const ordinal = last - index;

    return {
      season: SEASON_ORDER[ordinal % SEASON_ORDER.length],
      year: Math.floor(ordinal / SEASON_ORDER.length),
    };
  });
};

export const checkIsOnlyOneEpisode = (animeType: ANIME_TYPE) => {
  return animeType === ANIME_TYPE.SHORT_FILM || animeType === ANIME_TYPE.FILM;
};

export const finalizeMembersInfoArray = (
  membersInfo: Record<string, NotRequiredFieldFormValue | FieldFormValue | FieldFormValue[] | null>,
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
