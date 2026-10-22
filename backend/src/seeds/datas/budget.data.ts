import { INCOME_SOURCE } from '../../budget/enums/index.js';
import type { CreateIncomesData } from '../../budget/data/index.js';
import {
  seasonOfOrdinal,
  seasonOrdinal,
  seasonStartDay,
  shiftDays,
} from '../../projects/layout.js';

export const budgetSeeds = (today: string): CreateIncomesData[] => {
  const current = seasonOrdinal(today);

  return [current - 2, current - 1, current].flatMap((ordinal, step) => {
    const { season, year } = seasonOfOrdinal(ordinal);
    const dayOf = (offset: number) => {
      const day = shiftDays(seasonStartDay(ordinal), offset);

      return day > today ? today : day;
    };

    return [
      {
        date: dayOf(6),
        season,
        year,
        lines: [
          { source: INCOME_SOURCE.TEAM_JAR, amountKop: 250000 + step * 50000 },
          { source: INCOME_SOURCE.BMAC, amountKop: 45000 },
          { source: INCOME_SOURCE.DONATELLO, amountKop: 80000 },
        ],
      },
      {
        date: dayOf(20),
        season,
        year,
        lines: [
          {
            source: INCOME_SOURCE.ORDER,
            amountKop: 600000,
            title: 'Вітробой',
          },
          {
            source: INCOME_SOURCE.PROJECT_JAR,
            amountKop: 50000,
            title: 'Вітробой',
          },
          {
            source: INCOME_SOURCE.LISODAR,
            amountKop: 30000,
            nickname: 'Dixy',
          },
        ],
      },
    ];
  });
};
