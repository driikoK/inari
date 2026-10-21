import type { ProposalRole } from '@/stores/useProposalsStore';
import { seasonOptions } from '@/utils/constants';
import { convertSeasonEngToUkr } from '@/utils/convert';

export const proposalRoles: { value: ProposalRole; label: string }[] = [
  { value: 'sub', label: 'Перекладач' },
  { value: 'editor', label: 'Редактор' },
  { value: 'typesetter', label: 'Тайпсеттер' },
  { value: 'dubs', label: 'Дабер' },
  { value: 'fixers', label: 'Контроль якості' },
  { value: 'sound', label: 'Звукорежисер' },
  { value: 'releasers', label: 'Релізер' },
  { value: 'director', label: 'Куратор' },
];

export const fundingOptions = [
  { value: 'none', label: 'Не вказано' },
  { value: 'patron', label: 'Меценатський' },
  { value: 'order', label: 'Замовлення' },
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
