import { seasonLabel } from '@/pages/Proposals/const/options';
import { formatDay } from '@/pages/Projects/const/options';
import type {
  AllocationSnapshot,
  AuditSnapshot,
  BudgetEntry,
  CrumbSnapshot,
  ExpenseSnapshot,
  IncomeSnapshot,
} from '@/stores/useBudgetStore';
import {
  AUDIT_KIND,
  BUDGET_ERROR,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SUPPORT_DIRECTION,
} from '@/types';
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

export const directionOptions: { value: SUPPORT_DIRECTION; label: string }[] = [
  { value: SUPPORT_DIRECTION.COVERS, label: 'Кавери' },
  { value: SUPPORT_DIRECTION.PROMOTION, label: 'Команда просування' },
  { value: SUPPORT_DIRECTION.ADS, label: 'Реклама' },
  { value: SUPPORT_DIRECTION.SITE, label: 'Сайт' },
  { value: SUPPORT_DIRECTION.SERVER, label: 'Сервер для роздачі' },
  { value: SUPPORT_DIRECTION.BOTS, label: 'Командні боти' },
  { value: SUPPORT_DIRECTION.TRAINING, label: 'Навчання' },
  { value: SUPPORT_DIRECTION.EQUIPMENT, label: 'Техніка' },
  { value: SUPPORT_DIRECTION.HOLIDAY, label: 'Святкові ласощі' },
  { value: SUPPORT_DIRECTION.OTHER, label: 'Інше' },
];

export const directionLabel = (direction: SUPPORT_DIRECTION) =>
  directionOptions.find((option) => option.value === direction)?.label ?? direction;

export const expenseKindOptions: { value: EXPENSE_KIND; label: string }[] = [
  { value: EXPENSE_KIND.CARD, label: 'Вивести на карту' },
  { value: EXPENSE_KIND.DONATION, label: 'Задонатити' },
  { value: EXPENSE_KIND.DEVELOPMENT, label: 'На розвиток команди' },
];

export const expenseKindLabel = (kind: EXPENSE_KIND) =>
  ({
    [EXPENSE_KIND.CARD]: 'На карту',
    [EXPENSE_KIND.DONATION]: 'Донат',
    [EXPENSE_KIND.DEVELOPMENT]: 'На розвиток команди',
  })[kind];

// A category of the top of expenses
export const categoryLabel = (category: 'crumbs' | 'orders' | SUPPORT_DIRECTION) => {
  if (category === 'crumbs') return 'Крихти';
  if (category === 'orders') return 'Замовлення';

  return directionLabel(category);
};

export const auditKindOptions: { value: AUDIT_KIND; label: string }[] = [
  { value: AUDIT_KIND.INCOME_CREATED, label: 'Надходження додано' },
  { value: AUDIT_KIND.INCOME_UPDATED, label: 'Надходження змінено' },
  { value: AUDIT_KIND.INCOME_DELETED, label: 'Надходження видалено' },
  { value: AUDIT_KIND.SUPPORT_UPDATED, label: 'Печивко підтримки змінено' },
  { value: AUDIT_KIND.ALLOCATION_DELETED, label: 'Виділення видалено' },
  { value: AUDIT_KIND.EXPENSE_CREATED, label: 'Частування додано' },
  { value: AUDIT_KIND.EXPENSE_UPDATED, label: 'Частування змінено' },
  { value: AUDIT_KIND.EXPENSE_DELETED, label: 'Частування видалено' },
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

// Zero is allowed where it means "nothing left", like the budget of a direction
export const parseUahOrZero = (text: string): number | null => {
  const normalized = text.replace(/\s/g, '').replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  return Math.round(Number(normalized) * 100);
};

export const parseUah = (text: string): number | null => {
  const kop = parseUahOrZero(text);

  return kop && kop > 0 ? kop : null;
};

// A title is one budget however it was written, the server thinks so too
export const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

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
}: IncomeSnapshot) =>
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

const describeAllocation = ({ direction, amountKop, date, season, year }: AllocationSnapshot) =>
  [
    amountKop < 0 ? 'Повернення' : 'Виділення',
    directionLabel(direction),
    formatKop(Math.abs(amountKop)),
    seasonLabel(season, year),
    formatDay(date),
  ].join(' · ');

const describeExpense = ({
  kind,
  section,
  direction,
  amountKop,
  date,
  title,
  nickname,
  requisite,
  comment,
}: ExpenseSnapshot) =>
  [
    expenseKindLabel(kind),
    formatKop(amountKop),
    section === EXPENSE_SECTION.SUPPORT && direction
      ? `Підтримка: ${directionLabel(direction)}`
      : `Тістечка: ${title ?? 'Без назви'}`,
    nickname && `для ${nickname}`,
    requisite,
    comment && `«${comment}»`,
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
) => {
  switch (snapshot.type) {
    case 'track':
    case 'member':
      return describeCrumbs(snapshot, roleLabel);
    case ENTRY_TYPE.ALLOCATION:
      return describeAllocation(snapshot);
    case ENTRY_TYPE.EXPENSE:
      return describeExpense(snapshot);
    default:
      return describeIncome(snapshot);
  }
};

export const entryTypeOptions: { value: ENTRY_TYPE; label: string }[] = [
  { value: ENTRY_TYPE.INCOME, label: 'Надходження' },
  { value: ENTRY_TYPE.ALLOCATION, label: 'Виділення на підтримку' },
  { value: ENTRY_TYPE.EXPENSE, label: 'Частування' },
];

// What a record of the journal is, in a few words
export const entryKindLabel = (entry: BudgetEntry) => {
  switch (entry.type) {
    case ENTRY_TYPE.ALLOCATION:
      return entry.amountKop < 0 ? 'Повернення з підтримки' : 'Виділення на підтримку';
    case ENTRY_TYPE.EXPENSE:
      return `Частування · ${expenseKindLabel(entry.kind)}`;
    default:
      return sourceLabel(entry.source);
  }
};

// Only an income adds to the confectionery and only a card or a donation takes from it. An
// allocation and a gift to the development of the team move money inside it, so they have no sign.
export const formatEntryAmount = (entry: BudgetEntry) => {
  switch (entry.type) {
    case ENTRY_TYPE.ALLOCATION:
      return formatKop(Math.abs(entry.amountKop));
    case ENTRY_TYPE.EXPENSE:
      return entry.kind === EXPENSE_KIND.DEVELOPMENT
        ? formatKop(entry.amountKop)
        : formatSignedKop(-entry.amountKop);
    default:
      return formatSignedKop(entry.amountKop);
  }
};

export const entryDetails = (entry: BudgetEntry) => {
  switch (entry.type) {
    case ENTRY_TYPE.ALLOCATION:
      return directionLabel(entry.direction);
    case ENTRY_TYPE.EXPENSE:
      return [
        entry.section === EXPENSE_SECTION.SUPPORT && entry.direction
          ? directionLabel(entry.direction)
          : (entry.title ?? 'Без назви'),
        entry.nickname,
      ].join(' → ');
    default:
      return entry.title ?? entry.nickname ?? '—';
  }
};
