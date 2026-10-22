import { SEASON } from '../shared/index.js';
import {
  balancesOf,
  describeEntry,
  diffEffects,
  effectsOf,
  formatKop,
  negate,
  normalizeName,
  splitOrder,
  summarize,
} from './calc.js';
import { ENTRY_TYPE, INCOME_SOURCE, SIDE_KIND } from './enums/index.js';
import type { BudgetEntry } from './interfaces/index.js';

const entry = (extra: Partial<BudgetEntry> = {}): BudgetEntry => ({
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

describe('splitOrder', () => {
  it('gives a tenth to the general jar and the rest to the title', () => {
    expect(splitOrder(10000)).toEqual({ general: 1000, title: 9000 });
  });

  it.each([
    [15, 2, 13],
    [14, 1, 13],
    [5, 1, 4],
    [4, 0, 4],
    [1, 0, 1],
  ])(
    'rounds the general share of %i kop half up: %i and %i',
    (amount, general, title) => {
      expect(splitOrder(amount)).toEqual({ general, title });
    },
  );

  it('never loses a kopiyka', () => {
    for (const amount of [1, 7, 99, 12345, 999999]) {
      const { general, title } = splitOrder(amount);

      expect(general + title).toBe(amount);
    }
  });
});

describe('normalizeName', () => {
  it('ignores case, outer and repeated spaces', () => {
    expect(normalizeName('  Wind   BREAKER ')).toBe('wind breaker');
    expect(normalizeName(undefined)).toBe('');
  });
});

describe('formatKop', () => {
  it('shows hryvnias with two digits', () => {
    expect(formatKop(150000).replace(/\s/g, ' ')).toBe('1 500,00 грн');
    expect(formatKop(5)).toBe('0,05 грн');
  });
});

describe('effectsOf', () => {
  it.each([
    INCOME_SOURCE.BMAC,
    INCOME_SOURCE.DONATELLO,
    INCOME_SOURCE.TEAM_JAR,
  ])('puts %s wholly into the jar of its season', (source) => {
    expect(effectsOf(entry({ source }))).toEqual([
      {
        kind: SIDE_KIND.JAR,
        key: 'jar:2027-spring',
        label: 'Банка Весна 2027',
        deltaKop: 100000,
      },
    ]);
  });

  it('splits an order between the jar and the budget of its title', () => {
    const effects = effectsOf(
      entry({
        source: INCOME_SOURCE.ORDER,
        amountKop: 10000,
        title: 'Вітробой',
      }),
    );

    expect(effects).toEqual([
      expect.objectContaining({ kind: SIDE_KIND.JAR, deltaKop: 1000 }),
      {
        kind: SIDE_KIND.ORDERS,
        key: 'orders:title:вітробой',
        label: 'Тістечка: Вітробой',
        deltaKop: 9000,
      },
    ]);
  });

  it('counts one title written differently as one budget', () => {
    const key = (title: string) =>
      effectsOf(entry({ source: INCOME_SOURCE.ORDER, title }))[1].key;

    expect(key('Wind  Breaker')).toBe(key(' wind breaker'));
  });

  it('keys a title taken from the projects by its id, so a rename keeps one budget', () => {
    const key = (title: string) =>
      effectsOf(
        entry({ source: INCOME_SOURCE.ORDER, projectId: 'p1', title }),
      )[1].key;

    expect(key('Старе ім’я')).toBe('orders:project:p1');
    expect(key('Нове ім’я')).toBe('orders:project:p1');
  });

  it('shows a project jar in the jar and as a treat of that project', () => {
    expect(
      effectsOf(
        entry({
          source: INCOME_SOURCE.PROJECT_JAR,
          projectId: 'p1',
          title: 'Вітробой',
        }),
      ),
    ).toEqual([
      expect.objectContaining({ kind: SIDE_KIND.JAR, deltaKop: 100000 }),
      {
        kind: SIDE_KIND.TREATS,
        key: 'treats:project:p1',
        label: 'Смаколики: Вітробой',
        deltaKop: 100000,
      },
    ]);
  });

  it('names a treat without a title and a lisodar without a name', () => {
    const [, treat] = effectsOf(entry({ source: INCOME_SOURCE.PROJECT_JAR }));
    const [, lisodar] = effectsOf(entry({ source: INCOME_SOURCE.LISODAR }));

    expect(treat.label).toBe('Смаколики: Без назви');
    expect(lisodar.label).toBe('Лисодар: Без імені');
  });

  it('shows a lisodar in the jar and under the name of the giver, whatever its case', () => {
    const [jar, lisodar] = effectsOf(
      entry({ source: INCOME_SOURCE.LISODAR, nickname: ' Аня ' }),
    );

    expect(jar.deltaKop).toBe(100000);
    expect(lisodar).toEqual(
      expect.objectContaining({
        kind: SIDE_KIND.LISODARI,
        key: 'lisodari:аня',
        deltaKop: 100000,
      }),
    );
    expect(
      effectsOf(entry({ source: INCOME_SOURCE.LISODAR, nickname: 'АНЯ' }))[1]
        .key,
    ).toBe(lisodar.key);
  });
});

describe('diffEffects', () => {
  const diff = (before: Partial<BudgetEntry>, after: Partial<BudgetEntry>) =>
    diffEffects(effectsOf(entry(before)), effectsOf(entry(after)));

  it('answers the change of an amount as one row', () => {
    expect(diff({ amountKop: 100000 }, { amountKop: 150000 })).toEqual([
      expect.objectContaining({ key: 'jar:2027-spring', deltaKop: 50000 }),
    ]);
  });

  it('answers a move to another season as the jar losing and the jar gaining', () => {
    expect(
      diff({}, { season: SEASON.SUMMER }).map(({ key, deltaKop }) => [
        key,
        deltaKop,
      ]),
    ).toEqual([
      ['jar:2027-spring', -100000],
      ['jar:2027-summer', 100000],
    ]);
  });

  it('answers a change of the source as every side it touches', () => {
    const rows = diff(
      { source: INCOME_SOURCE.TEAM_JAR, amountKop: 10000 },
      { source: INCOME_SOURCE.ORDER, amountKop: 10000, title: 'Т' },
    );

    expect(rows.map(({ key, deltaKop }) => [key, deltaKop])).toEqual([
      ['jar:2027-spring', -9000],
      ['orders:title:т', 9000],
    ]);
  });

  it('still answers one row, with a zero, when only the date changed', () => {
    expect(diff({ date: '2027-05-10' }, { date: '2027-05-11' })).toEqual([
      expect.objectContaining({ key: 'jar:2027-spring', deltaKop: 0 }),
    ]);
  });
});

describe('negate', () => {
  it('turns every delta around without touching the rest', () => {
    expect(negate(effectsOf(entry())).map(({ deltaKop }) => deltaKop)).toEqual([
      -100000,
    ]);
  });
});

describe('balancesOf', () => {
  it('adds up the deltas of every side across entries', () => {
    const balances = balancesOf([
      entry({ amountKop: 100000 }),
      entry({ amountKop: 50000 }),
      entry({ source: INCOME_SOURCE.ORDER, amountKop: 10000, title: 'Т' }),
    ]);

    expect(balances.get('jar:2027-spring')).toBe(151000);
    expect(balances.get('orders:title:т')).toBe(9000);
  });

  it('counts a group of equal entries as many times as it holds', () => {
    const balances = balancesOf([
      { ...entry({ amountKop: 100000 }), count: 3 },
      {
        ...entry({ source: INCOME_SOURCE.ORDER, amountKop: 10000, title: 'Т' }),
        count: 2,
      },
    ]);

    expect(balances.get('jar:2027-spring')).toBe(302000);
    expect(balances.get('orders:title:т')).toBe(18000);
  });
});

describe('describeEntry', () => {
  it('says the source, the amount, the title or giver and the season', () => {
    const text = describeEntry(
      entry({
        source: INCOME_SOURCE.LISODAR,
        amountKop: 25000,
        nickname: 'Аня',
      }),
    );

    expect(text).toContain('«Лисодар»');
    expect(text.replace(/\s/g, ' ')).toContain('250,00 грн');
    expect(text).toContain('від Аня');
    expect(text).toContain('(Весна 2027)');
  });
});

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
  const crumbs = [
    { season: SEASON.SPRING, year: 2027, coins: 500 },
    { season: SEASON.SPRING, year: 2027, coins: 275 },
    { season: SEASON.WINTER, year: 2027, coins: 40 },
    { season: SEASON.FALL, year: 2026, coins: 999 },
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
});
