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
};

export const MIN_DAY = '2000-01-01';

// The backend judges "today" in Kyiv, so the form must too
export const todayDay = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' });

export const formatDay = (day: string) => day.split('-').reverse().join('.');

export const quotaOf = ({ isOngoing, isSequel, funding }: Project) =>
  [
    isOngoing ? 'онґоїнґ' : 'стареча',
    isSequel && 'продовження',
    funding === PROPOSAL_FUNDING.PATRON && 'меценатський',
    funding === PROPOSAL_FUNDING.ORDER && 'замовлення',
  ]
    .filter(Boolean)
    .join(', ');
