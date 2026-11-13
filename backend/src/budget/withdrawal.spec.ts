import { SEASON } from '../shared/index.js';
import type { SeasonRate } from './interfaces/index.js';
import {
  lockedSeasonsOf,
  nothingToWithdraw,
  paidOf,
  planWithdrawal,
  sharesOf,
  totalCrumbs,
} from './withdrawal.js';

const rates: SeasonRate[] = [
  { season: SEASON.WINTER, year: 2027, coefficient: 2 },
  { season: SEASON.SPRING, year: 2027, coefficient: 3.5 },
  { season: SEASON.SUMMER, year: 2027, coefficient: 0 },
  { season: SEASON.FALL, year: 2026, coefficient: null },
];

const seasons = [
  { season: SEASON.SPRING, year: 2027, coins: 100 },
  { season: SEASON.WINTER, year: 2027, coins: 40 },
  { season: SEASON.SUMMER, year: 2027, coins: 70 },
  { season: SEASON.FALL, year: 2026, coins: 30 },
  { season: SEASON.FALL, year: 2027, coins: 15 },
];

// Fall 2027 is the current season
const today = '2027-10-05';

describe('sharesOf', () => {
  it('takes only the finished seasons that have a coefficient, oldest first', () => {
    expect(sharesOf(seasons, rates, today)).toEqual([
      { season: SEASON.WINTER, year: 2027, crumbs: 40, coefficient: 2 },
      { season: SEASON.SPRING, year: 2027, crumbs: 100, coefficient: 3.5 },
    ]);
  });

  it('leaves out the current season even when it has a coefficient', () => {
    const withCurrent = [
      ...rates,
      { season: SEASON.FALL, year: 2027, coefficient: 9 },
    ];

    expect(
      sharesOf(seasons, withCurrent, today).some(({ year, season }) => {
        return year === 2027 && season === SEASON.FALL;
      }),
    ).toBe(false);
  });

  it('leaves out a season with no crumbs left and one that is not in the rates', () => {
    expect(
      sharesOf(
        [
          { season: SEASON.WINTER, year: 2027, coins: 0 },
          { season: SEASON.WINTER, year: 2020, coins: 5 },
        ],
        rates,
        today,
      ),
    ).toEqual([]);
  });

  it('copes with a nickname that has no seasons', () => {
    expect(sharesOf(undefined, rates, today)).toEqual([]);
  });
});

describe('lockedSeasonsOf', () => {
  it('splits the crumbs that cannot be paid out into the finished seasons with no money and the season that is running', () => {
    expect(lockedSeasonsOf(seasons, rates, today)).toEqual({
      uncovered: [
        { season: SEASON.FALL, year: 2026, coins: 30 },
        { season: SEASON.SUMMER, year: 2027, coins: 70 },
      ],
      running: [{ season: SEASON.FALL, year: 2027, coins: 15 }],
    });
  });

  it('counts a finished season that is not among the rates at all as one with no money', () => {
    expect(
      lockedSeasonsOf(
        [{ season: SEASON.WINTER, year: 2024, coins: 96.25 }],
        rates,
        today,
      ),
    ).toEqual({
      uncovered: [{ season: SEASON.WINTER, year: 2024, coins: 96.25 }],
      running: [],
    });
  });

  it('leaves out a season that can be paid out and one with no crumbs left', () => {
    expect(
      lockedSeasonsOf(
        [
          { season: SEASON.WINTER, year: 2027, coins: 40 },
          { season: SEASON.SPRING, year: 2027, coins: 0 },
        ],
        rates,
        today,
      ),
    ).toEqual({ uncovered: [], running: [] });
  });

  it('copes with a nickname that has no seasons', () => {
    expect(lockedSeasonsOf(undefined, rates, today)).toEqual({
      uncovered: [],
      running: [],
    });
  });
});

describe('nothingToWithdraw', () => {
  const none = { uncovered: [], running: [] };
  const winter2024 = { season: SEASON.WINTER, year: 2024, coins: 96.25 };
  const spring2025 = { season: SEASON.SPRING, year: 2025, coins: 10 };
  const fall2027 = { season: SEASON.FALL, year: 2027, coins: 15 };

  it('names the finished season whose jar has no money, and what to do about it', () => {
    const message = nothingToWithdraw(
      { ...none, uncovered: [winter2024] },
      false,
    );

    expect(message).toContain('сезон «Зима 2024»');
    expect(message).toContain('немає грошей');
    expect(message).toContain('коефіцієнт нульовий');
    expect(message).toContain('Адмін має внести надходження в цей сезон');
  });

  it('puts several seasons in the plural, oldest first as they come', () => {
    const message = nothingToWithdraw(
      { ...none, uncovered: [winter2024, spring2025] },
      false,
    );

    expect(message).toContain('сезони «Зима 2024», «Весна 2025»');
    expect(message).toContain('у банках цих сезонів');
    expect(message).toContain('в ці сезони');
  });

  it('says the running season has to end first', () => {
    expect(nothingToWithdraw({ ...none, running: [fall2027] }, false)).toBe(
      'Крихти за сезон «Осінь 2027» можна вивести після його завершення',
    );
  });

  it('says both when both are the case', () => {
    const message = nothingToWithdraw(
      { uncovered: [winter2024], running: [fall2027] },
      false,
    );

    expect(message).toContain('«Зима 2024»');
    expect(message).toContain(
      '«Осінь 2027» можна вивести після його завершення',
    );
    expect(message.indexOf('Зима 2024')).toBeLessThan(
      message.indexOf('Осінь 2027'),
    );
  });

  it('says that the open requests hold everything when that is the reason', () => {
    expect(nothingToWithdraw({ ...none, uncovered: [winter2024] }, true)).toBe(
      'Усі крихти, які можна вивести, уже в ваших відкритих запитах',
    );
  });

  it('says there is nothing at all for a nickname with no crumbs', () => {
    expect(nothingToWithdraw(none, false)).toBe('У вас немає крихт для виводу');
  });
});

describe('totalCrumbs', () => {
  it('adds the shares without floating noise', () => {
    expect(totalCrumbs([{ crumbs: 0.1 }, { crumbs: 0.2 }])).toBe(0.3);
  });
});

describe('planWithdrawal', () => {
  const shares = sharesOf(seasons, rates, today);

  it('takes from the oldest season first and pays each part at its own coefficient', () => {
    const { parts, missingCrumbs } = planWithdrawal(60, shares);

    expect(missingCrumbs).toBe(0);
    expect(parts).toEqual([
      {
        season: SEASON.WINTER,
        year: 2027,
        crumbs: 40,
        coefficient: 2,
        amountKop: 8000,
      },
      {
        season: SEASON.SPRING,
        year: 2027,
        crumbs: 20,
        coefficient: 3.5,
        amountKop: 7000,
      },
    ]);
  });

  it('stays within one season when it is enough', () => {
    const { parts } = planWithdrawal(25.5, shares);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ crumbs: 25.5, amountKop: 5100 });
  });

  it('says how many crumbs the seasons cannot give', () => {
    const { parts, missingCrumbs } = planWithdrawal(150, shares);

    expect(paidOf(parts)).toBe(8000 + 35000);
    expect(missingCrumbs).toBe(10);
  });

  it('is all missing when nothing can be withdrawn', () => {
    expect(planWithdrawal(5, [])).toEqual({ parts: [], missingCrumbs: 5 });
  });

  it('rounds a kopiyka down, so the payouts never add up to more than the jar', () => {
    const odd = [
      { season: SEASON.WINTER, year: 2027, crumbs: 10, coefficient: 0.3333 },
    ];

    expect(planWithdrawal(1.001, odd).parts[0].amountKop).toBe(33);
  });

  it('leaves a part that pays less than a kopiyka with the nickname, and counts it as asked', () => {
    const odd = [
      { season: SEASON.WINTER, year: 2027, crumbs: 10, coefficient: 0.3333 },
    ];

    expect(planWithdrawal(0.003, odd)).toEqual({ parts: [], missingCrumbs: 0 });
  });

  it('drops the dust of a later season and keeps paying the earlier one', () => {
    const { parts, missingCrumbs } = planWithdrawal(40.001, shares);

    expect(missingCrumbs).toBe(0);
    expect(parts).toEqual([
      expect.objectContaining({
        season: SEASON.WINTER,
        crumbs: 40,
        amountKop: 8000,
      }),
    ]);
  });

  it('counts crumbs of three digits exactly', () => {
    const exact = [
      { season: SEASON.WINTER, year: 2027, crumbs: 0.3, coefficient: 1 },
    ];
    const { parts, missingCrumbs } = planWithdrawal(0.1 + 0.2, exact);

    expect(missingCrumbs).toBe(0);
    expect(parts[0].crumbs).toBe(0.3);
  });
});
