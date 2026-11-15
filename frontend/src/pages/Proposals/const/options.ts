import { NO_FUNDING, PROPOSAL_FUNDING, TITLE_KIND } from '@/types';
import { seasonOptions } from '@/utils/constants';
import { convertSeasonEngToUkr } from '@/utils/convert';

export const fundingOptions = [
  { value: NO_FUNDING, label: 'Не вказано' },
  { value: PROPOSAL_FUNDING.PATRON, label: 'Меценатський' },
  { value: PROPOSAL_FUNDING.ORDER, label: 'Замовлення' },
] as const;

export const kindOptions = [
  { value: TITLE_KIND.ONGOING, label: 'Онґоїнґ' },
  { value: TITLE_KIND.OLD, label: 'Стареча' },
] as const;

export const seasonLabel = (season: string, year: number) =>
  `${convertSeasonEngToUkr(season)} ${year}`;

export const yearChoices = (now = new Date()) => {
  const year = now.getFullYear();

  return [year - 1, year, year + 1, year + 2];
};

export const nextSeason = (now = new Date()) => {
  const current = Math.floor(now.getMonth() / 3);
  const { value: season } = seasonOptions[(current + 1) % seasonOptions.length];

  return { season, year: now.getFullYear() + (current === seasonOptions.length - 1 ? 1 : 0) };
};
