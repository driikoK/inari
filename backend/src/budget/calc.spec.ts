import { SEASON } from '../shared/index.js';
import {
  balancesOf,
  describeEntry,
  diffEffects,
  effectsOf,
  findOverdraft,
  formatKop,
  negate,
  normalizeName,
  snapshotOf,
  splitOrder,
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
  AllocationEntry,
  ExpenseEntry,
  IncomeEntry,
} from './interfaces/index.js';

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
        season: SEASON.SPRING,
        year: 2027,
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
  const diff = (before: Partial<IncomeEntry>, after: Partial<IncomeEntry>) =>
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

const moves = (entry: Parameters<typeof effectsOf>[0]) =>
  effectsOf(entry).map(({ key, deltaKop }) => [key, deltaKop]);

describe('effectsOf allocations', () => {
  it('takes the money out of the jar of the season and into the direction', () => {
    expect(moves(allocation())).toEqual([
      ['jar:2027-spring', -50000],
      ['support:site', 50000],
    ]);
  });

  it('turns around for a negative one, which gives money back to the jar', () => {
    expect(moves(allocation({ amountKop: -20000 }))).toEqual([
      ['jar:2027-spring', 20000],
      ['support:site', -20000],
    ]);
  });

  it('names the direction in Ukrainian', () => {
    expect(effectsOf(allocation())[1].label).toBe('Підтримка: Сайт');
  });
});

describe('effectsOf expenses', () => {
  it('takes a payout from a direction and nothing else, the money leaves the team', () => {
    expect(moves(expense())).toEqual([['support:site', -10000]]);
    expect(moves(expense({ kind: EXPENSE_KIND.DONATION }))).toEqual([
      ['support:site', -10000],
    ]);
  });

  it('takes a payout from the budget of a title, a project by its id', () => {
    expect(
      moves(
        expense({
          section: EXPENSE_SECTION.ORDERS,
          direction: undefined,
          title: ' Вітробой ',
        }),
      ),
    ).toEqual([['orders:title:вітробой', -10000]]);
    expect(
      moves(
        expense({
          section: EXPENSE_SECTION.ORDERS,
          direction: undefined,
          projectId: 'p1',
          title: 'Старе',
        }),
      ),
    ).toEqual([['orders:project:p1', -10000]]);
  });

  it('moves what is left to the development of the team into the jar of the season and the lisodari', () => {
    expect(
      moves(expense({ kind: EXPENSE_KIND.DEVELOPMENT, nickname: ' Аня ' })),
    ).toEqual([
      ['support:site', -10000],
      ['jar:2027-spring', 10000],
      ['lisodari:аня', 10000],
    ]);
  });

  it('keeps the money of the team the same when it only moves', () => {
    const effects = effectsOf(
      expense({ kind: EXPENSE_KIND.DEVELOPMENT, amountKop: 7777 }),
    );
    const inTeam = effects
      .filter(({ kind }) => kind !== SIDE_KIND.LISODARI)
      .reduce((sum, { deltaKop }) => sum + deltaKop, 0);

    expect(inTeam).toBe(0);
  });
});

describe('balancesOf with every kind', () => {
  it('adds incomes, allocations and expenses into the balance of each side', () => {
    const balances = balancesOf([
      entry({ amountKop: 400000 }),
      allocation({ amountKop: 100000 }),
      expense({ amountKop: 25000 }),
    ]);

    expect(balances.get('jar:2027-spring')).toBe(300000);
    expect(balances.get('support:site')).toBe(75000);
  });
});

describe('findOverdraft', () => {
  const balances = new Map([
    ['jar:2027-spring', 10000],
    ['support:site', 500],
  ]);

  it('finds nothing when every side has enough', () => {
    expect(
      findOverdraft(balances, effectsOf(allocation({ amountKop: 10000 }))),
    ).toBeNull();
  });

  it('names the side that would go below zero, with what it has and what is needed', () => {
    expect(
      findOverdraft(balances, effectsOf(allocation({ amountKop: 10001 }))),
    ).toEqual({
      label: 'Банка Весна 2027',
      haveKop: 10000,
      needKop: 10001,
    });
    expect(
      findOverdraft(balances, effectsOf(expense({ amountKop: 501 }))),
    ).toEqual({
      label: 'Підтримка: Сайт',
      haveKop: 500,
      needKop: 501,
    });
  });

  it('adds up what one operation takes from the same side', () => {
    const twice = [
      ...effectsOf(allocation({ amountKop: 6000 })),
      ...effectsOf(allocation({ amountKop: 6000 })),
    ];

    expect(findOverdraft(balances, twice)?.needKop).toBe(12000);
  });

  it('lets an operation that gives and takes from a side in one go through', () => {
    expect(
      findOverdraft(
        balances,
        effectsOf(expense({ kind: EXPENSE_KIND.DEVELOPMENT, amountKop: 500 })),
      ),
    ).toBeNull();
  });

  it('does not blame a side that was already negative when it only gains', () => {
    expect(
      findOverdraft(
        new Map([['jar:2027-spring', -100]]),
        effectsOf(entry({ amountKop: 50 })),
      ),
    ).toBeNull();
  });

  it('knows a side that has no balance yet as zero', () => {
    expect(
      findOverdraft(new Map(), effectsOf(expense({ amountKop: 1 })))?.haveKop,
    ).toBe(0);
  });
});

describe('snapshotOf and describeEntry', () => {
  it('keeps what an expense is, with its requisite and its comment', () => {
    const snapshot = snapshotOf(
      expense({ requisite: '•••• 1111', comment: 'Дякуємо' }),
    );

    expect(snapshot).toEqual({
      type: ENTRY_TYPE.EXPENSE,
      kind: EXPENSE_KIND.CARD,
      section: EXPENSE_SECTION.SUPPORT,
      direction: SUPPORT_DIRECTION.SITE,
      amountKop: 10000,
      date: '2027-05-10',
      season: SEASON.SPRING,
      year: 2027,
      nickname: 'Аня',
      requisite: '•••• 1111',
      comment: 'Дякуємо',
    });
  });

  it('keeps an allocation and an income without what does not belong to them', () => {
    expect(snapshotOf(allocation())).toEqual({
      type: ENTRY_TYPE.ALLOCATION,
      direction: SUPPORT_DIRECTION.SITE,
      amountKop: 50000,
      date: '2027-05-10',
      season: SEASON.SPRING,
      year: 2027,
    });
    expect(snapshotOf(entry())).toEqual({
      type: ENTRY_TYPE.INCOME,
      source: INCOME_SOURCE.TEAM_JAR,
      amountKop: 100000,
      date: '2027-05-10',
      season: SEASON.SPRING,
      year: 2027,
    });
  });

  it('says an allocation and a return in their own words', () => {
    expect(describeEntry(snapshotOf(allocation()))).toContain(
      '«Виділення» Сайт:',
    );
    expect(
      describeEntry(snapshotOf(allocation({ amountKop: -100 }))),
    ).toContain('«Повернення» Сайт: 1,00 грн');
  });

  it('says where an expense came from and who it is for', () => {
    const text = describeEntry(snapshotOf(expense())).replace(/\s/g, ' ');

    expect(text).toBe(
      '«На карту» 100,00 грн Печивко підтримки → Сайт для Аня (Весна 2027)',
    );
    expect(
      describeEntry(
        snapshotOf(
          expense({
            kind: EXPENSE_KIND.DEVELOPMENT,
            section: EXPENSE_SECTION.ORDERS,
            direction: undefined,
            title: 'Вітробой',
          }),
        ),
      ),
    ).toContain('«На розвиток команди»');
    expect(
      describeEntry(
        snapshotOf(
          expense({
            section: EXPENSE_SECTION.ORDERS,
            direction: undefined,
            title: 'Вітробой',
          }),
        ),
      ),
    ).toContain('Тістечка замовлень → Вітробой');
  });
});
