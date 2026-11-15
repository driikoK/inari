import { SEASON } from '../shared/index.js';
import {
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SUPPORT_DIRECTION,
} from './enums/index.js';
import type {
  AllocationEntry,
  ExpenseEntry,
  IncomeEntry,
} from './interfaces/index.js';
import { orderBudgets, summarize } from './summary.js';

const entry = (extra: Partial<IncomeEntry> = {}): IncomeEntry => ({
  _id: '1',
  type: ENTRY_TYPE.INCOME,
  source: INCOME_SOURCE.TEAM_JAR,
  amountKop: 100000,
  date: '2027-05-10',
  season: SEASON.SPRING,
  year: 2027,
  createdBy: 'root',
  ...extra,
});

const allocation = (extra: Partial<AllocationEntry> = {}): AllocationEntry => ({
  _id: 'a',
  type: ENTRY_TYPE.ALLOCATION,
  direction: SUPPORT_DIRECTION.SITE,
  amountKop: 50000,
  date: '2027-05-10',
  season: SEASON.SPRING,
  year: 2027,
  createdBy: 'root',
  ...extra,
});

const expense = (extra: Partial<ExpenseEntry> = {}): ExpenseEntry => ({
  _id: 'x',
  type: ENTRY_TYPE.EXPENSE,
  kind: EXPENSE_KIND.CARD,
  section: EXPENSE_SECTION.SUPPORT,
  direction: SUPPORT_DIRECTION.SITE,
  amountKop: 10000,
  nickname: 'Аня',
  date: '2027-05-10',
  season: SEASON.SPRING,
  year: 2027,
  createdBy: 'root',
  ...extra,
});

const crumbs = [
  { season: SEASON.SPRING, year: 2027, coins: 500 },
  { season: SEASON.SPRING, year: 2027, coins: 275 },
  { season: SEASON.WINTER, year: 2027, coins: 40 },
  { season: SEASON.FALL, year: 2026, coins: 999 },
];

describe('summarize', () => {
  const entries = [
    entry({ amountKop: 100000 }),
    entry({ source: INCOME_SOURCE.ORDER, amountKop: 50000, title: 'Т' }),
    entry({ source: INCOME_SOURCE.LISODAR, amountKop: 20000, nickname: 'Аня' }),
    entry({ source: INCOME_SOURCE.PROJECT_JAR, amountKop: 30000, title: 'П' }),
    entry({
      amountKop: 10000,
      season: SEASON.WINTER,
      date: '2027-02-01',
    }),
  ];

  const [previous, current] = summarize(entries, crumbs, '2027-05-10').seasons;

  it('answers the previous and the current season, the current one flagged', () => {
    expect([previous.season, previous.isCurrent]).toEqual([
      SEASON.WINTER,
      false,
    ]);
    expect([current.season, current.isCurrent]).toEqual([SEASON.SPRING, true]);
  });

  it('takes the previous season across the turn of the year', () => {
    const [before] = summarize([], [], '2027-02-01').seasons;

    expect([before.season, before.year]).toEqual([SEASON.FALL, 2026]);
  });

  it('counts only the entries of the season, by the season they carry', () => {
    expect(current.incomeKop).toBe(200000);
    expect(previous.incomeKop).toBe(10000);
  });

  it('takes the title share of orders off the jar, a tenth of an order stays in it', () => {
    expect(current.ordersKop).toBe(45000);
    expect(current.jarKop).toBe(155000);
  });

  it('divides what is left by the crumbs the team earned in the season', () => {
    expect(current.crumbs).toBe(775);
    expect(current.coefficient).toBe(2);
    expect(previous.coefficient).toBe(2.5);
  });

  it('has no coefficient for a season without crumbs', () => {
    const [empty] = summarize(entries, [], '2027-05-10').seasons;

    expect(empty.crumbs).toBe(0);
    expect(empty.coefficient).toBeNull();
  });

  it('shows treats and lisodari as slices of the season', () => {
    expect(current.treatsKop).toBe(30000);
    expect(current.lisodariKop).toBe(20000);
    expect(previous.treatsKop).toBe(0);
  });

  it('gives the same answer for entries counted in groups', () => {
    const grouped = [
      { ...entry({ amountKop: 100000 }), count: 1 },
      {
        ...entry({ source: INCOME_SOURCE.ORDER, amountKop: 25000, title: 'Т' }),
        count: 2,
      },
    ];
    const single = [
      entry({ amountKop: 100000 }),
      entry({ source: INCOME_SOURCE.ORDER, amountKop: 25000, title: 'Т' }),
      entry({ source: INCOME_SOURCE.ORDER, amountKop: 25000, title: 'Т' }),
    ];

    expect(summarize(grouped, crumbs, '2027-05-10')).toEqual(
      summarize(single, crumbs, '2027-05-10'),
    );
  });

  it('totals the whole confectionery, the title budgets, the treats and the lisodari', () => {
    expect(summarize(entries, crumbs, '2027-05-10')).toMatchObject({
      today: '2027-05-10',
      confectioneryKop: 210000,
      ordersKop: 45000,
      treatsKop: 30000,
      lisodariKop: 20000,
      supportKop: 0,
    });
  });

  it('counts a record from before there were other kinds as an income', () => {
    const { type: _type, ...old } = entry({ amountKop: 12345 });
    const [, now] = summarize([old as IncomeEntry], [], '2027-05-10').seasons;

    expect(now.incomeKop).toBe(12345);
  });
});

describe('summarize with support budgets and expenses', () => {
  const today = '2027-05-10';
  const run = (...list: (IncomeEntry | AllocationEntry | ExpenseEntry)[]) =>
    summarize(list, crumbs, today);
  const jar = entry({ amountKop: 400000 });

  it('takes an allocation out of the jar of its season and puts it into the direction', () => {
    const summary = run(jar, allocation({ amountKop: 100000 }));
    const [, now] = summary.seasons;

    expect(now.supportKop).toBe(100000);
    expect(now.jarKop).toBe(300000);
    expect(now.coefficient).toBe(3.8709);
    expect(summary.supportKop).toBe(100000);
    expect(summary.confectioneryKop).toBe(400000);
  });

  it('gives a negative allocation back to the jar', () => {
    const summary = run(
      jar,
      allocation({ amountKop: 100000 }),
      allocation({ _id: 'b', amountKop: -30000 }),
    );

    expect(summary.seasons[1].jarKop).toBe(330000);
    expect(summary.supportKop).toBe(70000);
  });

  it('spends a direction without touching the jar, and the money is gone from the confectionery', () => {
    const summary = run(
      jar,
      allocation({ amountKop: 100000 }),
      expense({ amountKop: 25000 }),
    );

    expect(summary.seasons[1].jarKop).toBe(300000);
    expect(summary.supportKop).toBe(75000);
    expect(summary.confectioneryKop).toBe(375000);
  });

  it('spends the budget of a title and keeps what is left', () => {
    const summary = run(
      entry({ source: INCOME_SOURCE.ORDER, amountKop: 100000, title: 'Т' }),
      expense({
        section: EXPENSE_SECTION.ORDERS,
        direction: undefined,
        title: ' т ',
        amountKop: 20000,
      }),
    );

    expect(summary.ordersKop).toBe(70000);
    expect(summary.orders).toEqual([
      expect.objectContaining({
        title: 'Т',
        receivedKop: 90000,
        spentKop: 20000,
        balanceKop: 70000,
      }),
    ]);
  });

  it('gives the budgets of the titles alone as they are in the summary', () => {
    const records = [
      entry({ source: INCOME_SOURCE.ORDER, amountKop: 100000, title: 'Т' }),
      expense({
        section: EXPENSE_SECTION.ORDERS,
        direction: undefined,
        title: ' т ',
        amountKop: 20000,
      }),
    ];

    expect(orderBudgets(records)).toEqual(
      summarize(records, crumbs, '2027-05-20').orders,
    );
  });

  it('leaves what is given to the development of the team in the team, as a gift of the season', () => {
    const summary = run(
      entry({ source: INCOME_SOURCE.ORDER, amountKop: 100000, title: 'Т' }),
      expense({
        kind: EXPENSE_KIND.DEVELOPMENT,
        section: EXPENSE_SECTION.ORDERS,
        direction: undefined,
        title: 'Т',
        amountKop: 20000,
        nickname: 'Аня',
      }),
    );
    const [, now] = summary.seasons;

    expect(summary.confectioneryKop).toBe(100000);
    expect(summary.ordersKop).toBe(70000);
    expect(now.transfersKop).toBe(20000);
    expect(now.jarKop).toBe(10000 + 20000);
    expect(now.lisodariKop).toBe(20000);
    expect(summary.lisodariKop).toBe(20000);
    expect(summary.lisodari).toEqual([{ key: 'аня', name: 'Аня', kop: 20000 }]);
  });

  it('lists every direction, with what was allocated, spent and is left', () => {
    const { support } = run(
      allocation({ amountKop: 100000 }),
      allocation({ _id: 'b', amountKop: -20000 }),
      expense({ amountKop: 30000 }),
      expense({
        _id: 'y',
        kind: EXPENSE_KIND.DEVELOPMENT,
        amountKop: 5000,
      }),
    );

    expect(support.map(({ direction }) => direction)).toEqual(
      Object.values(SUPPORT_DIRECTION),
    );
    expect(
      support.find(({ direction }) => direction === SUPPORT_DIRECTION.SITE),
    ).toEqual({
      direction: SUPPORT_DIRECTION.SITE,
      allocatedKop: 80000,
      spentKop: 35000,
      balanceKop: 45000,
    });
    expect(
      support.find(({ direction }) => direction === SUPPORT_DIRECTION.BOTS),
    ).toMatchObject({ allocatedKop: 0, balanceKop: 0 });
  });

  describe('the title of a budget', () => {
    const older = {
      ...entry({
        source: INCOME_SOURCE.ORDER,
        amountKop: 100000,
        title: 'Старе ім’я',
        projectId: 'p1',
      }),
      lastDate: '2027-05-01',
    };
    const newer = {
      ...entry({
        _id: '2',
        source: INCOME_SOURCE.ORDER,
        amountKop: 50000,
        title: 'Нове ім’я',
        projectId: 'p1',
      }),
      lastDate: '2027-05-20',
    };
    const other = entry({
      _id: '3',
      source: INCOME_SOURCE.ORDER,
      amountKop: 200000,
      title: 'Інший',
    });

    it('lists the budgets of the titles by what is left, a project by its id', () => {
      const { orders } = run(older, newer, other);

      expect(
        orders.map(({ title, balanceKop }) => [title, balanceKop]),
      ).toEqual([
        ['Інший', 180000],
        ['Нове ім’я', 135000],
      ]);
      expect(orders[1].projectId).toBe('p1');
    });

    it('is the name of the newest record, in whatever order the groups come', () => {
      for (const list of [
        [older, newer],
        [newer, older],
      ]) {
        expect(run(...list).orders[0].title).toBe('Нове ім’я');
      }
    });

    it('takes the name of a payout when it is the newest record', () => {
      const payout = {
        ...expense({
          section: EXPENSE_SECTION.ORDERS,
          direction: undefined,
          projectId: 'p1',
          title: 'Перейменований',
        }),
        lastDate: '2027-06-01',
      };

      expect(run(older, newer, payout).orders[0].title).toBe('Перейменований');
    });

    it('is the same for the treats', () => {
      const jar = (title: string, lastDate: string) => ({
        ...entry({
          source: INCOME_SOURCE.PROJECT_JAR,
          amountKop: 1000,
          title,
          projectId: 'p1',
        }),
        lastDate,
      });

      for (const list of [
        [jar('Старе', '2027-01-01'), jar('Нове', '2027-02-01')],
        [jar('Нове', '2027-02-01'), jar('Старе', '2027-01-01')],
      ]) {
        expect(run(...list).treats[0].title).toBe('Нове');
      }
    });
  });

  it('adds up the support directions and the title budgets for the popups', () => {
    const summary = run(
      entry({ amountKop: 400000 }),
      entry({
        _id: '2',
        source: INCOME_SOURCE.ORDER,
        amountKop: 100000,
        title: 'Т',
      }),
      allocation({ amountKop: 100000 }),
      allocation({
        _id: 'b',
        direction: SUPPORT_DIRECTION.BOTS,
        amountKop: 20000,
      }),
      expense({ amountKop: 30000 }),
      expense({
        _id: 'y',
        section: EXPENSE_SECTION.ORDERS,
        direction: undefined,
        title: 'Т',
        amountKop: 4000,
      }),
    );

    expect(summary).toMatchObject({
      supportAllocatedKop: 120000,
      supportSpentKop: 30000,
      supportKop: 90000,
      ordersReceivedKop: 90000,
      ordersSpentKop: 4000,
      ordersKop: 86000,
    });
  });

  it('lists the treats by title and the lisodari by person, whatever the case', () => {
    const summary = run(
      entry({
        source: INCOME_SOURCE.PROJECT_JAR,
        amountKop: 30000,
        title: 'П',
      }),
      entry({
        _id: '2',
        source: INCOME_SOURCE.PROJECT_JAR,
        amountKop: 10000,
        title: ' п ',
      }),
      entry({
        _id: '3',
        source: INCOME_SOURCE.LISODAR,
        amountKop: 5000,
        nickname: 'Аня',
      }),
      entry({
        _id: '4',
        source: INCOME_SOURCE.LISODAR,
        amountKop: 7000,
        nickname: ' аня ',
      }),
    );

    expect(summary.treats).toEqual([
      expect.objectContaining({ title: 'П', kop: 40000 }),
    ]);
    expect(summary.lisodari).toEqual([{ key: 'аня', name: 'Аня', kop: 12000 }]);
  });

  it('shows the incomes of a season by source', () => {
    const [, now] = run(
      jar,
      entry({ _id: '2', source: INCOME_SOURCE.BMAC, amountKop: 5000 }),
      entry({ _id: '3', source: INCOME_SOURCE.BMAC, amountKop: 2500 }),
    ).seasons;

    expect(now.sources).toEqual([
      { source: INCOME_SOURCE.BMAC, kop: 7500 },
      { source: INCOME_SOURCE.TEAM_JAR, kop: 400000 },
    ]);
  });

  describe('payouts of crumbs', () => {
    const payout = (extra: Partial<ExpenseEntry> = {}): ExpenseEntry =>
      expense({
        _id: 'p',
        section: EXPENSE_SECTION.CRUMBS,
        direction: undefined,
        amountKop: 80000,
        crumbs: 40,
        coefficient: 2,
        crumbSeason: SEASON.WINTER,
        crumbYear: 2027,
        season: SEASON.SPRING,
        year: 2027,
        ...extra,
      });
    const winterJar = entry({
      _id: 'w',
      amountKop: 400000,
      season: SEASON.WINTER,
      date: '2027-02-01',
    });
    const [winter, spring] = run(winterJar, jar, payout()).seasons;

    it('come out of the jar of the season of the crumbs, and show as payouts there', () => {
      expect(winter.payoutsKop).toBe(80000);
      expect(winter.jarKop).toBe(320000);
      expect(spring.payoutsKop).toBe(0);
      expect(spring.jarKop).toBe(400000);
    });

    it('never move the coefficient of that season', () => {
      const without = run(winterJar, jar).seasons[0];

      expect(winter.coefficient).toBe(without.coefficient);
    });

    it('lower the confectionery when paid to a card or a donation', () => {
      expect(run(winterJar, jar, payout()).confectioneryKop).toBe(720000);
    });

    it('as a gift to the team keep the confectionery, lift the jar and the coefficient of the date, and make a lisodar', () => {
      const gift = run(
        winterJar,
        jar,
        payout({ kind: EXPENSE_KIND.DEVELOPMENT }),
      );
      const [giftWinter, giftSpring] = gift.seasons;

      expect(gift.confectioneryKop).toBe(800000);
      expect(giftWinter.jarKop).toBe(320000);
      expect(giftSpring.transfersKop).toBe(80000);
      expect(giftSpring.jarKop).toBe(480000);
      expect(gift.lisodari).toEqual([{ key: 'аня', name: 'Аня', kop: 80000 }]);
    });

    it('show as «Крихти» in the top of the season of their date, a gift to the team does not', () => {
      expect(spring.expenses).toEqual([{ category: 'crumbs', kop: 80000 }]);
      expect(winter.expenses).toEqual([]);
      expect(
        run(winterJar, jar, payout({ kind: EXPENSE_KIND.DEVELOPMENT }))
          .seasons[1].expenses,
      ).toEqual([]);
    });

    it('do not touch the directions or the budgets of titles', () => {
      const { support, orders } = run(winterJar, jar, payout());

      expect(support.every(({ spentKop }) => spentKop === 0)).toBe(true);
      expect(orders).toEqual([]);
    });
  });

  describe('the top of expenses', () => {
    const spend = (extra: Partial<ExpenseEntry>) =>
      expense({ _id: String(Math.random()), ...extra });

    it('puts the orders and every direction in order of what was paid in the season of the date', () => {
      const [, now] = run(
        spend({ amountKop: 10000 }),
        spend({ amountKop: 15000, direction: SUPPORT_DIRECTION.SERVER }),
        spend({
          amountKop: 40000,
          section: EXPENSE_SECTION.ORDERS,
          direction: undefined,
          title: 'Т',
        }),
        spend({
          amountKop: 99000,
          season: SEASON.WINTER,
        }),
      ).seasons;

      expect(now.expenses).toEqual([
        { category: 'orders', kop: 40000 },
        { category: SUPPORT_DIRECTION.SERVER, kop: 15000 },
        { category: SUPPORT_DIRECTION.SITE, kop: 10000 },
      ]);
    });

    it('leaves out the money that stayed in the team', () => {
      const [, now] = run(
        spend({ amountKop: 10000, kind: EXPENSE_KIND.DEVELOPMENT }),
      ).seasons;

      expect(now.expenses).toEqual([]);
    });

    it('is empty when nothing was paid', () => {
      expect(run(jar).seasons[1].expenses).toEqual([]);
    });
  });
});
