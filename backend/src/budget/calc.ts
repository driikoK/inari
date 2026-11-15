import type { SEASON } from '../shared/index.js';
import {
  DIRECTION_LABEL,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  KIND_LABEL,
  ORDER_GENERAL_PERCENT,
  SEASON_LABEL,
  SIDE_KIND,
  SOURCE_LABEL,
  type SUPPORT_DIRECTION,
} from './enums/index.js';
import type {
  BudgetEntry,
  Change,
  Effect,
  EntryGroup,
  EntrySnapshot,
} from './interfaces/index.js';

export const NO_TITLE = 'Без назви';
export const NO_NAME = 'Без імені';

export const round3 = (value: number) => Math.round(value * 1000) / 1000;

export const formatCrumbs = (value: number) =>
  round3(value).toLocaleString('uk-UA', { maximumFractionDigits: 3 });

const COEFFICIENT_TICKS = 10000;

// Hryvnias per crumb, rounded down to four digits so that what is paid out at
// this rate never adds up to more than the jar holds. The integer maths keeps a
// whole number of hryvnias from falling a tick short.
export const coefficientOf = (
  jarKop: number,
  earnedCrumbs: number,
): number | null => {
  if (!(earnedCrumbs > 0)) return null;

  const milliCrumbs = Math.max(1, Math.round(earnedCrumbs * 1000));
  const ticks = Math.floor((jarKop * 100000) / milliCrumbs);

  return Math.max(0, ticks) / COEFFICIENT_TICKS;
};

// What crumbs are worth in kopiykas at a coefficient, rounded down to a kopiyka
export const kopOfCrumbs = (crumbs: number, coefficient: number) =>
  Math.floor(
    (Math.round(crumbs * 1000) * Math.round(coefficient * COEFFICIENT_TICKS)) /
      100000,
  );

export const splitOrder = (amountKop: number) => {
  const general = Math.floor((amountKop * ORDER_GENERAL_PERCENT + 50) / 100);

  return { general, title: amountKop - general };
};

export const normalizeName = (value = '') =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

export const seasonLabel = (season: SEASON, year: number) =>
  `${SEASON_LABEL[season]} ${year}`;

export const formatKop = (kop: number) =>
  `${(kop / 100).toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} грн`;

type Titled = { projectId?: string; title?: string };

export const titleKey = ({ projectId, title }: Titled) =>
  projectId ? `project:${projectId}` : `title:${normalizeName(title)}`;

// A record from before there were other kinds has no type: it is an income
export const typeOf = (entry: { type?: ENTRY_TYPE }) =>
  entry.type ?? ENTRY_TYPE.INCOME;

export const jarKey = (season: SEASON, year: number) => `jar:${year}-${season}`;

export const created = (entry: BudgetEntry): Change => ({
  entry,
  before: null,
  after: snapshotOf(entry),
  effects: effectsOf(snapshotOf(entry)),
});

const jarOf = (season: SEASON, year: number) => ({
  kind: SIDE_KIND.JAR,
  key: jarKey(season, year),
  label: `Банка ${seasonLabel(season, year)}`,
  season,
  year,
});

const lisodarOf = (nickname: string | undefined, deltaKop: number): Effect => ({
  kind: SIDE_KIND.LISODARI,
  key: `lisodari:${normalizeName(nickname)}`,
  label: `Лисодар: ${nickname || NO_NAME}`,
  deltaKop,
});

const supportOf = (direction: SUPPORT_DIRECTION, deltaKop: number): Effect => ({
  kind: SIDE_KIND.SUPPORT,
  key: `support:${direction}`,
  label: `Підтримка: ${DIRECTION_LABEL[direction]}`,
  deltaKop,
});

const ordersOf = (titled: Titled, deltaKop: number): Effect => ({
  kind: SIDE_KIND.ORDERS,
  key: `orders:${titleKey(titled)}`,
  label: `Тістечка: ${titled.title || NO_TITLE}`,
  deltaKop,
});

const incomeEffects = (
  entry: Extract<EntryGroup, { source: INCOME_SOURCE }>,
): Effect[] => {
  const { source, amountKop, season, year, title, nickname } = entry;
  const jar = jarOf(season, year);

  switch (source) {
    case INCOME_SOURCE.ORDER: {
      const { general, title: titleKop } = splitOrder(amountKop);

      return [{ ...jar, deltaKop: general }, ordersOf(entry, titleKop)];
    }
    case INCOME_SOURCE.PROJECT_JAR:
      return [
        { ...jar, deltaKop: amountKop },
        {
          kind: SIDE_KIND.TREATS,
          key: `treats:${titleKey(entry)}`,
          label: `Смаколики: ${title || NO_TITLE}`,
          deltaKop: amountKop,
        },
      ];
    case INCOME_SOURCE.LISODAR:
      return [{ ...jar, deltaKop: amountKop }, lisodarOf(nickname, amountKop)];
    default:
      return [{ ...jar, deltaKop: amountKop }];
  }
};

// Every record moves money between the sides it names. The jars, the title
// budgets and the directions hold all the money of the team, together they are
// the confectionery. The treats and the lisodari only show where part of it
// came from.
export const effectsOf = (entry: EntryGroup): Effect[] => {
  switch (entry.type) {
    case ENTRY_TYPE.ALLOCATION:
      return [
        {
          ...jarOf(entry.season, entry.year),
          deltaKop: -entry.amountKop,
        },
        supportOf(entry.direction, entry.amountKop),
      ];
    case ENTRY_TYPE.EXPENSE: {
      const { amountKop, kind, section, direction } = entry;
      const from =
        section === EXPENSE_SECTION.CRUMBS &&
        entry.crumbSeason &&
        entry.crumbYear !== undefined
          ? {
              ...jarOf(entry.crumbSeason, entry.crumbYear),
              deltaKop: -amountKop,
            }
          : section === EXPENSE_SECTION.SUPPORT && direction
            ? supportOf(direction, -amountKop)
            : ordersOf(entry, -amountKop);

      // Money given to the development of the team stays in the team: it
      // lands in the jar of the season as a gift with a name
      if (kind === EXPENSE_KIND.DEVELOPMENT) {
        return [
          from,
          { ...jarOf(entry.season, entry.year), deltaKop: amountKop },
          lisodarOf(entry.nickname, amountKop),
        ];
      }

      return [from];
    }
    default:
      return incomeEffects(entry);
  }
};

export const negate = (effects: Effect[]): Effect[] =>
  effects.map((effect) => ({ ...effect, deltaKop: -effect.deltaKop }));

export const diffEffects = (before: Effect[], after: Effect[]): Effect[] => {
  const merged = new Map<string, Effect>();

  for (const effect of before) {
    merged.set(effect.key, { ...effect, deltaKop: -effect.deltaKop });
  }

  for (const effect of after) {
    const known = merged.get(effect.key);

    merged.set(effect.key, {
      ...effect,
      deltaKop: effect.deltaKop + (known?.deltaKop ?? 0),
    });
  }

  const changed = [...merged.values()].filter(({ deltaKop }) => deltaKop !== 0);

  return changed.length > 0 ? changed : [{ ...after[0], deltaKop: 0 }];
};

export const balancesOf = (entries: EntryGroup[]) => {
  const balances = new Map<string, number>();

  for (const entry of entries) {
    for (const { key, deltaKop } of effectsOf(entry)) {
      balances.set(
        key,
        (balances.get(key) ?? 0) + deltaKop * (entry.count ?? 1),
      );
    }
  }

  return balances;
};

export interface Overdraft {
  label: string;
  haveKop: number;
  needKop: number;
}

// Nothing may go below zero. Only a side that gives money away in this very
// operation is blamed, so a side that was already negative can still be fixed.
export const findOverdraft = (
  balances: Map<string, number>,
  effects: Effect[],
): Overdraft | null => {
  const net = new Map<string, { label: string; kop: number }>();

  for (const { key, label, deltaKop } of effects) {
    net.set(key, { label, kop: (net.get(key)?.kop ?? 0) + deltaKop });
  }

  for (const [key, { label, kop }] of net) {
    const haveKop = balances.get(key) ?? 0;

    if (kop < 0 && haveKop + kop < 0) {
      return { label, haveKop, needKop: -kop };
    }
  }

  return null;
};

export const overdraftMessage = ({ label, haveKop, needKop }: Overdraft) =>
  `Недостатньо коштів у «${label}»: є ${formatKop(Math.max(haveKop, 0))}, потрібно ${formatKop(needKop)}`;

export const snapshotOf = (entry: BudgetEntry): EntrySnapshot => {
  const { amountKop, date, season, year } = entry;

  switch (entry.type) {
    case ENTRY_TYPE.ALLOCATION:
      return {
        type: entry.type,
        direction: entry.direction,
        amountKop,
        date,
        season,
        year,
      };
    case ENTRY_TYPE.EXPENSE:
      return {
        type: entry.type,
        kind: entry.kind,
        section: entry.section,
        ...(entry.direction && { direction: entry.direction }),
        amountKop,
        date,
        season,
        year,
        ...(entry.projectId && { projectId: entry.projectId }),
        ...(entry.title && { title: entry.title }),
        nickname: entry.nickname,
        ...(entry.crumbSeason && { crumbSeason: entry.crumbSeason }),
        ...(entry.crumbYear !== undefined && { crumbYear: entry.crumbYear }),
        ...(entry.crumbs !== undefined && { crumbs: entry.crumbs }),
        ...(entry.coefficient !== undefined && {
          coefficient: entry.coefficient,
        }),
        ...(entry.requisite && { requisite: entry.requisite }),
        ...(entry.comment && { comment: entry.comment }),
      };
    default:
      return {
        type: ENTRY_TYPE.INCOME,
        source: entry.source,
        amountKop,
        date,
        season,
        year,
        ...(entry.projectId && { projectId: entry.projectId }),
        ...(entry.title && { title: entry.title }),
        ...(entry.nickname && { nickname: entry.nickname }),
      };
  }
};

export const describeEntry = (entry: EntrySnapshot) => {
  const period = `(${seasonLabel(entry.season, entry.year)})`;

  switch (entry.type) {
    case ENTRY_TYPE.ALLOCATION:
      return [
        entry.amountKop < 0 ? '«Повернення»' : '«Виділення»',
        `${DIRECTION_LABEL[entry.direction]}:`,
        formatKop(Math.abs(entry.amountKop)),
        period,
      ].join(' ');
    case ENTRY_TYPE.EXPENSE: {
      const section =
        entry.section === EXPENSE_SECTION.CRUMBS &&
        entry.crumbSeason &&
        entry.crumbYear !== undefined
          ? `Крихти ${seasonLabel(entry.crumbSeason, entry.crumbYear)}${entry.crumbs === undefined ? '' : `, ${formatCrumbs(entry.crumbs)} крихт`}`
          : entry.section === EXPENSE_SECTION.SUPPORT && entry.direction
            ? `Печивко підтримки → ${DIRECTION_LABEL[entry.direction]}`
            : `Тістечка замовлень → ${entry.title || NO_TITLE}`;

      return [
        `«${KIND_LABEL[entry.kind]}» ${formatKop(entry.amountKop)}`,
        section,
        entry.nickname && `для ${entry.nickname}`,
        period,
      ]
        .filter(Boolean)
        .join(' ');
    }
    default:
      return [
        `«${SOURCE_LABEL[entry.source]}» ${formatKop(entry.amountKop)}`,
        entry.title && `тайтл «${entry.title}»`,
        entry.nickname && `від ${entry.nickname}`,
        period,
      ]
        .filter(Boolean)
        .join(' ');
  }
};
