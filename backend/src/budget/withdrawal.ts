import { ordinalOf, seasonOrdinal } from '../projects/layout.js';
import type { SEASON } from '../shared/index.js';
import { kopOfCrumbs, round3 } from './calc.js';
import type {
  SeasonRate,
  SeasonShare,
  WithdrawalPart,
} from './interfaces/index.js';

interface SeasonCounter {
  season: SEASON;
  year: number;
  coins: number;
}

// The crumbs of a nickname that can be paid out now: only those of a finished
// season, and only of a season that has a coefficient. Oldest season first.
export const sharesOf = (
  seasons: SeasonCounter[] | undefined,
  rates: SeasonRate[],
  today: string,
): SeasonShare[] => {
  const current = seasonOrdinal(today);

  return (seasons ?? [])
    .filter(({ season, year }) => ordinalOf(season, year) < current)
    .map(({ season, year, coins }) => ({
      season,
      year,
      crumbs: round3(coins),
      coefficient:
        rates.find((rate) => rate.season === season && rate.year === year)
          ?.coefficient ?? 0,
    }))
    .filter(({ crumbs, coefficient }) => crumbs > 0 && coefficient > 0)
    .sort((a, b) => ordinalOf(a.season, a.year) - ordinalOf(b.season, b.year));
};

export const totalCrumbs = (shares: { crumbs: number }[]) =>
  round3(shares.reduce((total, { crumbs }) => total + crumbs, 0));

// Takes the crumbs from the oldest season first, each part paid at the
// coefficient of its own season. Whatever the seasons cannot give is missing.
// A part that would pay less than a kopiyka is not taken at all: it counts as
// asked, but the crumbs stay with the nickname.
export const planWithdrawal = (crumbs: number, shares: SeasonShare[]) => {
  let left = Math.round(crumbs * 1000);
  const parts: WithdrawalPart[] = [];

  for (const share of shares) {
    if (left <= 0) break;

    const take = Math.min(left, Math.round(share.crumbs * 1000));

    if (take <= 0) continue;

    left -= take;

    const taken = take / 1000;
    const amountKop = kopOfCrumbs(taken, share.coefficient);

    if (amountKop < 1) continue;

    parts.push({
      season: share.season,
      year: share.year,
      crumbs: taken,
      coefficient: share.coefficient,
      amountKop,
    });
  }

  return { parts, missingCrumbs: left / 1000 };
};

export const paidOf = (parts: { amountKop: number }[]) =>
  parts.reduce((total, { amountKop }) => total + amountKop, 0);
