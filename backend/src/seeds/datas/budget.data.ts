import {
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SUPPORT_DIRECTION,
} from '../../budget/enums/index.js';
import type {
  CreateExpensesData,
  CreateIncomesData,
  UpdateSupportData,
} from '../../budget/data/index.js';
import {
  seasonOfDay,
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

// What the directions should hold this season, out of the jar of this season
export const supportSeeds = (today: string): UpdateSupportData => ({
  date: today,
  ...seasonOfDay(today),
  targets: [
    { direction: SUPPORT_DIRECTION.SITE, targetKop: 150000 },
    { direction: SUPPORT_DIRECTION.SERVER, targetKop: 200000 },
    { direction: SUPPORT_DIRECTION.COVERS, targetKop: 80000 },
    { direction: SUPPORT_DIRECTION.OTHER, targetKop: 20000 },
  ],
});

export const expenseSeeds = (today: string): CreateExpensesData[] => [
  {
    date: today,
    comment: 'Оплата сервера за квартал',
    lines: [
      {
        kind: EXPENSE_KIND.CARD,
        amountKop: 50000,
        section: EXPENSE_SECTION.SUPPORT,
        direction: SUPPORT_DIRECTION.SERVER,
        nickname: 'Dixy',
        requisite: '4111 1111 1111 1111',
      },
    ],
  },
  {
    date: today,
    comment: 'Винагорода за замовлення',
    lines: [
      {
        kind: EXPENSE_KIND.DONATION,
        amountKop: 100000,
        section: EXPENSE_SECTION.ORDERS,
        title: 'Вітробой',
        nickname: 'Luthien',
        requisite: 'https://send.monobank.ua/jar/demo',
      },
      {
        kind: EXPENSE_KIND.DEVELOPMENT,
        amountKop: 50000,
        section: EXPENSE_SECTION.ORDERS,
        title: 'Вітробой',
        nickname: 'Kitsune',
      },
    ],
  },
];
