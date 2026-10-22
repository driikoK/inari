import { seasonLabel } from '@/pages/Proposals/const/options';
import { formatDay } from '@/pages/Projects/const/options';
import type { AuditSnapshot, CrumbSnapshot } from '@/stores/useBudgetStore';
import { AUDIT_KIND, BUDGET_ERROR, INCOME_SOURCE } from '@/types';
import { seasonOptions } from '@/utils/constants';

export const MAX_KOP = 1_000_000_000;

export const incomeSourceOptions: { value: INCOME_SOURCE; label: string }[] = [
  { value: INCOME_SOURCE.BMAC, label: 'Buy me a coffee' },
  { value: INCOME_SOURCE.DONATELLO, label: 'Donatello' },
  { value: INCOME_SOURCE.TEAM_JAR, label: 'Банка команди' },
  { value: INCOME_SOURCE.PROJECT_JAR, label: 'Банка проєкту' },
  { value: INCOME_SOURCE.ORDER, label: 'Замовлення' },
  { value: INCOME_SOURCE.LISODAR, label: 'Лисодар' },
];

export const sourceLabel = (source: INCOME_SOURCE) =>
  incomeSourceOptions.find((option) => option.value === source)?.label ?? source;

export const auditKindOptions: { value: AUDIT_KIND; label: string }[] = [
  { value: AUDIT_KIND.INCOME_CREATED, label: 'Надходження додано' },
  { value: AUDIT_KIND.INCOME_UPDATED, label: 'Надходження змінено' },
  { value: AUDIT_KIND.INCOME_DELETED, label: 'Надходження видалено' },
  { value: AUDIT_KIND.TRACK_CREATED, label: 'Трек додано' },
  { value: AUDIT_KIND.TRACK_UPDATED, label: 'Трек змінено' },
  { value: AUDIT_KIND.TRACK_DELETED, label: 'Трек видалено' },
  { value: AUDIT_KIND.MEMBER_CREATED, label: 'Нікнейм додано' },
  { value: AUDIT_KIND.MEMBER_ADJUSTED, label: 'Крихти змінено вручну' },
  { value: AUDIT_KIND.CRUMBS_INITIAL, label: 'Початковий стан крихт' },
];

export const auditKindLabel = (kind: AUDIT_KIND) =>
  auditKindOptions.find((option) => option.value === kind)?.label ?? kind;

const kopFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const coefficientFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export const formatKop = (kop: number) => `${kopFormat.format(kop / 100)} грн`;

export const formatSignedKop = (kop: number) => {
  if (kop === 0) return formatKop(0);

  return `${kop > 0 ? '+' : '−'}${formatKop(Math.abs(kop))}`;
};

const crumbsFormat = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 3 });

export const formatCrumbs = (crumbs: number) => crumbsFormat.format(crumbs);

export const formatSignedCrumbs = (crumbs: number) => {
  if (crumbs === 0) return formatCrumbs(0);

  return `${crumbs > 0 ? '+' : '−'}${formatCrumbs(Math.abs(crumbs))}`;
};

// Zero is a real coefficient (crumbs earned, nothing in the jar yet), only null means no crumbs
export const formatCoefficient = (coefficient: number | null) =>
  coefficient === null ? '—' : `1 крихта = ${coefficientFormat.format(coefficient)} грн`;

export const isAuditNotSaved = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'error' in error &&
  error.error === BUDGET_ERROR.AUDIT_NOT_SAVED;

export const seasonOfDay = (day: string) => {
  const [year, month] = day.split('-').map(Number);

  return { season: seasonOptions[Math.floor((month - 1) / 3)].value, year };
};

export const recentSeasons = (today: string, count = 8) => {
  const { season, year } = seasonOfDay(today);
  const current = year * seasonOptions.length + seasonOptions.findIndex((o) => o.value === season);

  return Array.from({ length: count }, (_, step) => {
    const ordinal = current - step;

    return {
      season: seasonOptions[ordinal % seasonOptions.length].value,
      year: Math.floor(ordinal / seasonOptions.length),
    };
  });
};

export const seasonKey = (season: string, year: number) => `${season}-${year}`;

export const parseUah = (text: string): number | null => {
  const normalized = text.replace(/\s/g, '').replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const kop = Math.round(Number(normalized) * 100);

  return kop > 0 ? kop : null;
};

export const kopToUah = (kop: number) =>
  kop % 100 === 0 ? String(kop / 100) : (kop / 100).toFixed(2).replace('.', ',');

const describeIncome = ({
  source,
  amountKop,
  date,
  season,
  year,
  title,
  nickname,
}: AuditSnapshot) =>
  [
    sourceLabel(source),
    formatKop(amountKop),
    title && `«${title}»`,
    nickname && `від ${nickname}`,
    seasonLabel(season, year),
    formatDay(date),
  ]
    .filter(Boolean)
    .join(' · ');

const describeCrumbs = (snapshot: CrumbSnapshot, roleLabel: (role: string) => string) => {
  if (snapshot.type === 'track') {
    const { nameTitle, currentEpisode, nickname, typeRole, coins, season, year } = snapshot;

    return [
      `«${nameTitle}» еп. ${currentEpisode}`,
      nickname,
      roleLabel(typeRole),
      `${formatCrumbs(coins)} крихт`,
      seasonLabel(season, year),
    ].join(' · ');
  }

  const bySeason = snapshot.seasons
    .map(({ season, year, coins }) => `${seasonLabel(season, year)}: ${formatCrumbs(coins)}`)
    .join(', ');

  return [
    snapshot.nickname,
    `${formatCrumbs(snapshot.coins)} крихт`,
    bySeason && `за сезонами — ${bySeason}`,
  ]
    .filter(Boolean)
    .join(' · ');
};

export const describeSnapshot = (
  snapshot: AuditSnapshot | CrumbSnapshot,
  roleLabel: (role: string) => string = (role) => role,
) => ('type' in snapshot ? describeCrumbs(snapshot, roleLabel) : describeIncome(snapshot));
