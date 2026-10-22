import { CoinsTotalFilterData } from './coins-total.data.js';

describe('CoinsTotalFilterData', () => {
  it('counts guests when the query does not say otherwise', () => {
    expect(CoinsTotalFilterData.parse({})).toEqual({ includeGuests: true });
  });

  it('reads includeGuests from a query string, where "false" must not turn into true', () => {
    expect(
      CoinsTotalFilterData.parse({ includeGuests: 'false' }).includeGuests,
    ).toBe(false);
    expect(
      CoinsTotalFilterData.parse({ includeGuests: 'true' }).includeGuests,
    ).toBe(true);
  });

  it('rejects an includeGuests that is not a boolean', () => {
    expect(
      CoinsTotalFilterData.safeParse({ includeGuests: 'maybe' }).success,
    ).toBe(false);
  });

  it('takes a season together with its year', () => {
    expect(
      CoinsTotalFilterData.parse({ season: 'winter', year: '2025' }),
    ).toEqual({ season: 'winter', year: 2025, includeGuests: true });
  });

  it.each([{ season: 'winter' }, { year: '2025' }])(
    'rejects a season without a year and a year without a season: %o',
    (query) => {
      const result = CoinsTotalFilterData.safeParse(query);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Сезон і рік вказуються разом',
      );
    },
  );
});
