import { seasonOfOrdinal, seasonOrdinal } from '../projects/layout.js';
import type { SEASON } from '../shared/index.js';
import type { SeasonCoins } from '../tracks/interfaces/track.interface.js';
import {
  effectsOf,
  NO_NAME,
  NO_TITLE,
  normalizeName,
  round3,
  splitOrder,
  titleKey,
  typeOf,
} from './calc.js';
import {
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SIDE_KIND,
  SUPPORT_DIRECTION,
} from './enums/index.js';
import type {
  BudgetSummary,
  EntryGroup,
  ExpenseLine,
  LisodarLine,
  SeasonSummary,
  SupportLine,
  TitleLine,
  TreatLine,
} from './interfaces/index.js';

type Income = Extract<EntryGroup, { source: INCOME_SOURCE }>;
type Allocation = Extract<EntryGroup, { type: ENTRY_TYPE.ALLOCATION }>;
type Expense = Extract<EntryGroup, { type: ENTRY_TYPE.EXPENSE }>;

interface Parts {
  incomes: Income[];
  allocations: Allocation[];
  expenses: Expense[];
}

const round4 = (value: number) => Math.round(value * 10000) / 10000;

const sum = <T>(items: T[], pick: (item: T) => number) =>
  items.reduce((total, item) => total + pick(item), 0);

const times = (group: EntryGroup) => group.count ?? 1;

const total = <T extends EntryGroup>(items: T[], pick: (item: T) => number) =>
  sum(items, (item) => pick(item) * times(item));

const amountOf = ({ amountKop }: EntryGroup) => amountKop;

const split = (entries: EntryGroup[]): Parts => ({
  incomes: entries.filter(
    (entry): entry is Income => typeOf(entry) === ENTRY_TYPE.INCOME,
  ),
  allocations: entries.filter(
    (entry): entry is Allocation => entry.type === ENTRY_TYPE.ALLOCATION,
  ),
  expenses: entries.filter(
    (entry): entry is Expense => entry.type === ENTRY_TYPE.EXPENSE,
  ),
});

const isOfSource = (source: INCOME_SOURCE) => (income: Income) =>
  income.source === source;

const isDevelopment = ({ kind }: Expense) => kind === EXPENSE_KIND.DEVELOPMENT;

const titleShare = (income: Income) => splitOrder(income.amountKop).title;

const topExpenses = (expenses: Expense[]): ExpenseLine[] => {
  const paid = expenses.filter((expense) => !isDevelopment(expense));
  const lines: ExpenseLine[] = [
    {
      category: 'orders',
      kop: total(
        paid.filter(({ section }) => section === EXPENSE_SECTION.ORDERS),
        amountOf,
      ),
    },
    ...Object.values(SUPPORT_DIRECTION).map((direction) => ({
      category: direction,
      kop: total(
        paid.filter(
          (expense) =>
            expense.section === EXPENSE_SECTION.SUPPORT &&
            expense.direction === direction,
        ),
        amountOf,
      ),
    })),
  ];

  return lines.filter(({ kop }) => kop > 0).sort((a, b) => b.kop - a.kop);
};

const summarizeSeason = (
  { incomes, allocations, expenses }: Parts,
  crumbs: SeasonCoins[],
  { season, year }: { season: SEASON; year: number },
  isCurrent: boolean,
): SeasonSummary => {
  const here = <T extends EntryGroup>(items: T[]) =>
    items.filter((item) => item.season === season && item.year === year);
  const incomesHere = here(incomes);
  const transfers = here(expenses).filter(isDevelopment);

  const incomeKop = total(incomesHere, amountOf);
  const transfersKop = total(transfers, amountOf);
  const supportKop = total(here(allocations), amountOf);
  const ordersKop = total(
    incomesHere.filter(isOfSource(INCOME_SOURCE.ORDER)),
    titleShare,
  );
  const payoutsKop = 0;
  const jarBeforePayoutsKop = incomeKop + transfersKop - supportKop - ordersKop;
  const earned = sum(
    crumbs.filter((item) => item.season === season && item.year === year),
    ({ coins }) => coins,
  );

  return {
    season,
    year,
    isCurrent,
    incomeKop,
    transfersKop,
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
      incomesHere.filter(isOfSource(INCOME_SOURCE.PROJECT_JAR)),
      amountOf,
    ),
    lisodariKop:
      total(incomesHere.filter(isOfSource(INCOME_SOURCE.LISODAR)), amountOf) +
      transfersKop,
    sources: Object.values(INCOME_SOURCE)
      .map((source) => ({
        source,
        kop: total(incomesHere.filter(isOfSource(source)), amountOf),
      }))
      .filter(({ kop }) => kop > 0),
    expenses: topExpenses(here(expenses)),
  };
};

const supportLines = ({ allocations, expenses }: Parts): SupportLine[] =>
  Object.values(SUPPORT_DIRECTION).map((direction) => {
    const allocatedKop = total(
      allocations.filter((allocation) => allocation.direction === direction),
      amountOf,
    );
    const spentKop = total(
      expenses.filter(
        (expense) =>
          expense.section === EXPENSE_SECTION.SUPPORT &&
          expense.direction === direction,
      ),
      amountOf,
    );

    return {
      direction,
      allocatedKop,
      spentKop,
      balanceKop: allocatedKop - spentKop,
    };
  });

// A title can be written in several ways, or renamed after some records were
// made. The name of the newest record wins, and the order the database
// returns the groups in does not matter.
const newestTitles = (entries: (Income | Expense)[]) => {
  const newest = new Map<string, { date: string; title: string }>();

  for (const entry of entries) {
    const key = titleKey(entry);
    const date = entry.lastDate ?? '';
    const title = entry.title || NO_TITLE;
    const known = newest.get(key);

    if (
      !known ||
      date > known.date ||
      (date === known.date && title > known.title)
    ) {
      newest.set(key, { date, title });
    }
  }

  return newest;
};

// A title is one budget however it was written, a project by its id
const titleLines = ({ incomes, expenses }: Parts): TitleLine[] => {
  const orders = incomes.filter(isOfSource(INCOME_SOURCE.ORDER));
  const payouts = expenses.filter(
    ({ section }) => section === EXPENSE_SECTION.ORDERS,
  );
  const titles = newestTitles([...orders, ...payouts]);
  const lines = new Map<string, TitleLine>();
  const line = (entry: { projectId?: string; title?: string }) => {
    const key = titleKey(entry);
    const known = lines.get(key) ?? {
      key,
      title: titles.get(key)?.title ?? NO_TITLE,
      ...(entry.projectId && { projectId: entry.projectId }),
      receivedKop: 0,
      spentKop: 0,
      balanceKop: 0,
    };

    lines.set(key, known);

    return known;
  };

  for (const income of orders) {
    line(income).receivedKop += titleShare(income) * times(income);
  }

  for (const expense of payouts) {
    line(expense).spentKop += expense.amountKop * times(expense);
  }

  return [...lines.values()]
    .map((item) => ({ ...item, balanceKop: item.receivedKop - item.spentKop }))
    .sort(
      (a, b) => b.balanceKop - a.balanceKop || a.title.localeCompare(b.title),
    );
};

const treatLines = ({ incomes }: Parts): TreatLine[] => {
  const jars = incomes.filter(isOfSource(INCOME_SOURCE.PROJECT_JAR));
  const titles = newestTitles(jars);
  const lines = new Map<string, TreatLine>();

  for (const income of jars) {
    const key = titleKey(income);
    const known = lines.get(key) ?? {
      key,
      title: titles.get(key)?.title ?? NO_TITLE,
      ...(income.projectId && { projectId: income.projectId }),
      kop: 0,
    };

    known.kop += income.amountKop * times(income);
    lines.set(key, known);
  }

  return [...lines.values()].sort(
    (a, b) => b.kop - a.kop || a.title.localeCompare(b.title),
  );
};

// A person is one name however it was written
const lisodarLines = ({ incomes, expenses }: Parts): LisodarLine[] => {
  const lines = new Map<string, LisodarLine>();
  const add = (nickname: string | undefined, kop: number) => {
    const key = normalizeName(nickname);
    const known = lines.get(key) ?? {
      key,
      name: nickname?.trim() || NO_NAME,
      kop: 0,
    };

    known.kop += kop;
    lines.set(key, known);
  };

  for (const income of incomes.filter(isOfSource(INCOME_SOURCE.LISODAR))) {
    add(income.nickname, income.amountKop * times(income));
  }

  for (const expense of expenses.filter(isDevelopment)) {
    add(expense.nickname, expense.amountKop * times(expense));
  }

  return [...lines.values()].sort(
    (a, b) => b.kop - a.kop || a.name.localeCompare(b.name),
  );
};

export const summarize = (
  entries: EntryGroup[],
  crumbs: SeasonCoins[],
  today: string,
): BudgetSummary => {
  const parts = split(entries);
  const current = seasonOrdinal(today);
  const support = supportLines(parts);
  const orders = titleLines(parts);

  const onSide = (kind: SIDE_KIND) =>
    sum(entries, (entry) =>
      sum(
        effectsOf(entry).filter((effect) => effect.kind === kind),
        ({ deltaKop }) => deltaKop * times(entry),
      ),
    );

  return {
    today,
    seasons: [current - 1, current].map((ordinal) =>
      summarizeSeason(
        parts,
        crumbs,
        seasonOfOrdinal(ordinal),
        ordinal === current,
      ),
    ),
    confectioneryKop:
      onSide(SIDE_KIND.JAR) +
      onSide(SIDE_KIND.ORDERS) +
      onSide(SIDE_KIND.SUPPORT),
    supportKop: onSide(SIDE_KIND.SUPPORT),
    ordersKop: onSide(SIDE_KIND.ORDERS),
    treatsKop: onSide(SIDE_KIND.TREATS),
    lisodariKop: onSide(SIDE_KIND.LISODARI),
    supportAllocatedKop: sum(support, ({ allocatedKop }) => allocatedKop),
    supportSpentKop: sum(support, ({ spentKop }) => spentKop),
    ordersReceivedKop: sum(orders, ({ receivedKop }) => receivedKop),
    ordersSpentKop: sum(orders, ({ spentKop }) => spentKop),
    support,
    orders,
    treats: treatLines(parts),
    lisodari: lisodarLines(parts),
  };
};
