import { seasonOfOrdinal, seasonOrdinal } from '../projects/layout.js';
import type { SEASON } from '../shared/index.js';
import type { SeasonCoins } from '../tracks/interfaces/track.interface.js';
import {
  INCOME_SOURCE,
  ORDER_GENERAL_PERCENT,
  SEASON_LABEL,
  SIDE_KIND,
  SOURCE_LABEL,
} from './enums/index.js';
import type {
  BudgetEntry,
  BudgetSummary,
  Effect,
  EntryFacts,
  EntryGroup,
  EntrySnapshot,
  SeasonSummary,
} from './interfaces/index.js';

const NO_TITLE = 'Без назви';
const NO_NAME = 'Без імені';

const sum = <T>(items: T[], pick: (item: T) => number) =>
  items.reduce((total, item) => total + pick(item), 0);

const total = (groups: EntryGroup[], pick: (group: EntryGroup) => number) =>
  sum(groups, (group) => pick(group) * (group.count ?? 1));

export const round3 = (value: number) => Math.round(value * 1000) / 1000;
const round4 = (value: number) => Math.round(value * 10000) / 10000;

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

const titleKey = ({ projectId, title }: EntryFacts) =>
  projectId ? `project:${projectId}` : `title:${normalizeName(title)}`;

export const effectsOf = (entry: EntryFacts): Effect[] => {
  const { source, amountKop, season, year, title, nickname } = entry;
  const jar = {
    kind: SIDE_KIND.JAR,
    key: `jar:${year}-${season}`,
    label: `Банка ${seasonLabel(season, year)}`,
  };

  switch (source) {
    case INCOME_SOURCE.ORDER: {
      const { general, title: titleKop } = splitOrder(amountKop);

      return [
        { ...jar, deltaKop: general },
        {
          kind: SIDE_KIND.ORDERS,
          key: `orders:${titleKey(entry)}`,
          label: `Тістечка: ${title || NO_TITLE}`,
          deltaKop: titleKop,
        },
      ];
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
      return [
        { ...jar, deltaKop: amountKop },
        {
          kind: SIDE_KIND.LISODARI,
          key: `lisodari:${normalizeName(nickname)}`,
          label: `Лисодар: ${nickname || NO_NAME}`,
          deltaKop: amountKop,
        },
      ];
    default:
      return [{ ...jar, deltaKop: amountKop }];
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

export const snapshotOf = ({
  source,
  amountKop,
  date,
  season,
  year,
  projectId,
  title,
  nickname,
}: BudgetEntry): EntrySnapshot => ({
  source,
  amountKop,
  date,
  season,
  year,
  ...(projectId && { projectId }),
  ...(title && { title }),
  ...(nickname && { nickname }),
});

export const describeEntry = ({
  source,
  amountKop,
  season,
  year,
  title,
  nickname,
}: EntrySnapshot) =>
  [
    `«${SOURCE_LABEL[source]}» ${formatKop(amountKop)}`,
    title && `тайтл «${title}»`,
    nickname && `від ${nickname}`,
    `(${seasonLabel(season, year)})`,
  ]
    .filter(Boolean)
    .join(' ');

const summarizeSeason = (
  entries: EntryGroup[],
  crumbs: SeasonCoins[],
  { season, year }: { season: SEASON; year: number },
  isCurrent: boolean,
): SeasonSummary => {
  const inSeason = entries.filter(
    (entry) => entry.season === season && entry.year === year,
  );
  const of = (source: INCOME_SOURCE) =>
    inSeason.filter((entry) => entry.source === source);

  const incomeKop = total(inSeason, ({ amountKop }) => amountKop);
  const ordersKop = total(
    of(INCOME_SOURCE.ORDER),
    ({ amountKop }) => splitOrder(amountKop).title,
  );
  const supportKop = 0;
  const payoutsKop = 0;
  const jarBeforePayoutsKop = incomeKop - supportKop - ordersKop;
  const earned = sum(
    crumbs.filter((item) => item.season === season && item.year === year),
    ({ coins }) => coins,
  );

  return {
    season,
    year,
    isCurrent,
    incomeKop,
    supportKop,
    ordersKop,
    payoutsKop,
    jarKop: jarBeforePayoutsKop - payoutsKop,
    crumbs: round3(earned),
    coefficient:
      earned > 0
        ? Math.max(0, round4(jarBeforePayoutsKop / 100 / earned))
        : null,
    treatsKop: total(
      of(INCOME_SOURCE.PROJECT_JAR),
      ({ amountKop }) => amountKop,
    ),
    lisodariKop: total(of(INCOME_SOURCE.LISODAR), ({ amountKop }) => amountKop),
  };
};

export const summarize = (
  entries: EntryGroup[],
  crumbs: SeasonCoins[],
  today: string,
): BudgetSummary => {
  const current = seasonOrdinal(today);
  const bySource = (source: INCOME_SOURCE) =>
    entries.filter((entry) => entry.source === source);

  return {
    today,
    seasons: [current - 1, current].map((ordinal) =>
      summarizeSeason(
        entries,
        crumbs,
        seasonOfOrdinal(ordinal),
        ordinal === current,
      ),
    ),
    confectioneryKop: total(entries, ({ amountKop }) => amountKop),
    supportKop: 0,
    ordersKop: total(
      bySource(INCOME_SOURCE.ORDER),
      ({ amountKop }) => splitOrder(amountKop).title,
    ),
    treatsKop: total(
      bySource(INCOME_SOURCE.PROJECT_JAR),
      ({ amountKop }) => amountKop,
    ),
    lisodariKop: total(
      bySource(INCOME_SOURCE.LISODAR),
      ({ amountKop }) => amountKop,
    ),
  };
};
