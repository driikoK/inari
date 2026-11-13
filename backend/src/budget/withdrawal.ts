import { ordinalOf, seasonOrdinal } from '../projects/layout.js';
import type { SEASON } from '../shared/index.js';
import { kopOfCrumbs, round3, seasonLabel } from './calc.js';
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

export interface LockedSeasons {
  // Finished seasons with crumbs whose jar has no money, so they have no coefficient
  uncovered: SeasonCounter[];
  // The season that is still going on, whose coefficient is not final
  running: SeasonCounter[];
}

// The crumbs of a nickname that cannot be paid out, and why, season by season
export const lockedSeasonsOf = (
  seasons: SeasonCounter[] | undefined,
  rates: SeasonRate[],
  today: string,
): LockedSeasons => {
  const current = seasonOrdinal(today);
  const locked: LockedSeasons = { uncovered: [], running: [] };
  const withCrumbs = (seasons ?? [])
    .filter(({ coins }) => round3(coins) > 0)
    .sort((a, b) => ordinalOf(a.season, a.year) - ordinalOf(b.season, b.year));

  for (const counter of withCrumbs) {
    const { season, year } = counter;
    const coefficient =
      rates.find((rate) => rate.season === season && rate.year === year)
        ?.coefficient ?? 0;

    if (ordinalOf(season, year) >= current) locked.running.push(counter);
    else if (!(coefficient > 0)) locked.uncovered.push(counter);
  }

  return locked;
};

const namesOf = (list: SeasonCounter[]) =>
  list.map(({ season, year }) => `«${seasonLabel(season, year)}»`).join(', ');

// What to tell a nickname that has nothing to withdraw right now
export const nothingToWithdraw = (
  { uncovered, running }: LockedSeasons,
  allReserved: boolean,
) => {
  if (allReserved) {
    return 'Усі крихти, які можна вивести, уже в ваших відкритих запитах';
  }

  const reasons: string[] = [];

  if (uncovered.length === 1) {
    reasons.push(
      `Крихти за сезон ${namesOf(uncovered)} поки не можна вивести: у банці цього сезону немає грошей, тому коефіцієнт нульовий. Адмін має внести надходження в цей сезон`,
    );
  } else if (uncovered.length > 1) {
    reasons.push(
      `Крихти за сезони ${namesOf(uncovered)} поки не можна вивести: у банках цих сезонів немає грошей, тому коефіцієнт нульовий. Адмін має внести надходження в ці сезони`,
    );
  }

  if (running.length) {
    reasons.push(
      `Крихти за сезон ${namesOf(running)} можна вивести після його завершення`,
    );
  }

  return reasons.length ? reasons.join('. ') : 'У вас немає крихт для виводу';
};

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
