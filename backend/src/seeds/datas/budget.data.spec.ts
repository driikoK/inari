import { CreateIncomesData } from '../../budget/data/index.js';
import { balancesOf } from '../../budget/calc.js';
import { ENTRY_TYPE } from '../../budget/enums/index.js';
import { budgetSeeds } from './budget.data.js';

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
          type: ENTRY_TYPE.INCOME,
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
