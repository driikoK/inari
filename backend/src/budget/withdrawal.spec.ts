import { SEASON } from '../shared/index.js';
import type { SeasonRate } from './interfaces/index.js';
import { paidOf, planWithdrawal, sharesOf, totalCrumbs } from './withdrawal.js';

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
