import { isCardNumber } from '../../budget/card.js';
import {
  CreateExpensesData,
  CreateIncomesData,
  UpdateSupportData,
} from '../../budget/data/index.js';
import { balancesOf, effectsOf, findOverdraft } from '../../budget/calc.js';
import { ENTRY_TYPE, EXPENSE_KIND } from '../../budget/enums/index.js';
import type { Effect, EntryGroup } from '../../budget/interfaces/index.js';
import { seasonOfDay } from '../../projects/layout.js';
import { budgetSeeds, expenseSeeds, supportSeeds } from './budget.data.js';

describe('budgetSeeds', () => {
  it.each(['2027-05-10', '2027-01-02', '2027-12-31'])(
    'gives incomes the budget accepts, none in the future, when today is %s',
    (today) => {
      for (const incomes of budgetSeeds(today)) {
        expect(CreateIncomesData.safeParse(incomes).success).toBe(true);
        expect(incomes.date <= today).toBe(true);
      }
    },
  );

  it('covers the current and the two previous seasons, twice each', () => {
    const operations = budgetSeeds('2027-05-10');

    expect(operations.map(({ season, year }) => `${season}-${year}`)).toEqual([
      'fall-2026',
      'fall-2026',
      'winter-2027',
      'winter-2027',
      'spring-2027',
      'spring-2027',
    ]);
  });

  it('puts money into the jar of every season, and into orders, treats and lisodari', () => {
    const entries = budgetSeeds('2027-05-10').flatMap(
      ({ date, season, year, lines }) =>
        lines.map((line) => ({
          _id: 'x',
          type: ENTRY_TYPE.INCOME as const,
          createdBy: 'seed',
          date,
          season,
          year,
          ...line,
        })),
    );
    const kinds = [...balancesOf(entries).keys()].map(
      (key) => key.split(':')[0],
    );

    expect(new Set(kinds)).toEqual(
      new Set(['jar', 'orders', 'treats', 'lisodari']),
    );
  });
});

describe('supportSeeds and expenseSeeds', () => {
  const days = ['2027-05-10', '2027-01-02', '2027-12-31'];

  it.each(days)('give the budget what it accepts when today is %s', (today) => {
    expect(UpdateSupportData.safeParse(supportSeeds(today)).success).toBe(true);

    for (const expenses of expenseSeeds(today)) {
      expect(CreateExpensesData.safeParse(expenses).success).toBe(true);
      expect(expenses.date <= today).toBe(true);
    }
  });

  it.each(days)(
    'can be played on top of the incomes without any side going below zero when today is %s',
    (today) => {
      const balances = new Map<string, number>();
      const apply = (effects: Effect[]) => {
        expect(findOverdraft(balances, effects)).toBeNull();

        for (const { key, deltaKop } of effects) {
          balances.set(key, (balances.get(key) ?? 0) + deltaKop);
        }
      };

      for (const { season, year, lines } of budgetSeeds(today)) {
        for (const line of lines) {
          apply(
            effectsOf({
              type: ENTRY_TYPE.INCOME,
              season,
              year,
              ...line,
            } as EntryGroup),
          );
        }
      }

      const { season, year, targets } = supportSeeds(today);

      for (const { direction, targetKop } of targets) {
        apply(
          effectsOf({
            type: ENTRY_TYPE.ALLOCATION,
            direction,
            amountKop: targetKop,
            season,
            year,
          }),
        );
      }

      for (const { date, lines } of expenseSeeds(today)) {
        const { season: spentIn, year: spentYear } = seasonOfDay(date);

        for (const line of lines) {
          apply(
            effectsOf({
              type: ENTRY_TYPE.EXPENSE,
              season: spentIn,
              year: spentYear,
              ...line,
            } as EntryGroup),
          );
        }
      }
    },
  );

  it('keeps the card number of a seeded payout valid', () => {
    for (const { lines } of expenseSeeds('2027-05-10')) {
      for (const { kind, requisite } of lines) {
        if (kind === EXPENSE_KIND.CARD && requisite) {
          expect(isCardNumber(requisite)).toBe(true);
        }
      }
    }
  });
});
