import type { Project } from '@/stores/useProjectsStore';
import { ANIME_TYPE, PROJECT_MARK, PROPOSAL_FUNDING } from '@/types';
import { convertAnimeTypeEngToUkr } from '@/utils/convert';

export const projectTypes = [
  ANIME_TYPE.SERIES,
  ANIME_TYPE.FILM,
  ANIME_TYPE.SHORT_FILM,
  ANIME_TYPE.TRAILER,
].map((value) => ({ value, label: convertAnimeTypeEngToUkr(value) }));

export const markLabels: Record<PROJECT_MARK, string> = {
  [PROJECT_MARK.ONGOING]: 'Онґоїнґ',
  [PROJECT_MARK.OLD]: 'Стареча',
  [PROJECT_MARK.DEBT]: 'Борг сезону',
  [PROJECT_MARK.PLANNED]: 'Заплановано',
};

export const NO_COLLAB = 'none';
export const COLLAB_TEAM = 'team';

export type CollabChoice = typeof NO_COLLAB | typeof COLLAB_TEAM;

export const collabOptions = [
  { value: NO_COLLAB, label: 'Не вказано' },
  { value: COLLAB_TEAM, label: 'Колаба' },
] as const;

export const MAX_COLLAB_TEAM = 100;

// The types that count released episodes: a series and the trailers called «оповідки»
export const hasEpisodeCount = (type: ANIME_TYPE) =>
  type === ANIME_TYPE.SERIES || type === ANIME_TYPE.TRAILER;

export const MAX_PLANNED_YEARS = 2;

// 29 February rolls over to 1 March when the target year has no such day
export const latestStartDay = (today: string) => {
  const [year, month, day] = today.split('-').map(Number);

  return new Date(Date.UTC(year + MAX_PLANNED_YEARS, month - 1, day)).toISOString().slice(0, 10);
};

export const MIN_DAY = '2000-01-01';

// The first day of spring 2020, the first season of the team: it did not exist before. The
// Budget keeps its own, wider limit (MIN_DAY).
export const MIN_PROJECT_DAY = '2020-04-01';

export const todayDay = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' });

export const formatDay = (day: string) => day.split('-').reverse().join('.');

export const quotaOf = ({ isOngoing, isSequel, funding }: Project) =>
  [
    isOngoing ? 'Онґоїнґ' : 'Стареча',
    isSequel && 'продовження',
    funding === PROPOSAL_FUNDING.PATRON && 'Меценатський',
    funding === PROPOSAL_FUNDING.ORDER && 'Замовлення',
  ]
    .filter(Boolean)
    .join(', ');
