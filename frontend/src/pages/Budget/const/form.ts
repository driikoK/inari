import { z } from 'zod';

import { MIN_DAY, todayDay } from '@/pages/Projects/const/options';
import type {
  IncomeEntry,
  IncomeLinePayload,
  IncomePayload,
  IncomesPayload,
} from '@/stores/useBudgetStore';
import { INCOME_SOURCE } from '@/types';
import { seasonOptions } from '@/utils/constants';
import { kopToUah, MAX_KOP, parseUah, seasonOfDay } from './options';

const REQUIRED_MESSAGE = 'Обов’язкове поле';

export interface IncomeLineValues {
  source: INCOME_SOURCE;
  amount: string;
  projectId: string;
  title: string;
  nickname: string;
}

export interface IncomeFormValues {
  date: string;
  season: string;
  year: string;
  lines: IncomeLineValues[];
}

const hasTitle = (source: INCOME_SOURCE) =>
  source === INCOME_SOURCE.ORDER || source === INCOME_SOURCE.PROJECT_JAR;

const lineSchema = z
  .object({
    source: z.enum(INCOME_SOURCE, { error: REQUIRED_MESSAGE }),
    amount: z
      .string({ error: REQUIRED_MESSAGE })
      .trim()
      .min(1, REQUIRED_MESSAGE)
      .refine((value) => parseUah(value) !== null, {
        error: 'Введіть суму, наприклад 1500 або 1500,50',
        when: ({ issues }) => issues.length === 0,
      })
      .refine((value) => (parseUah(value) ?? 0) <= MAX_KOP, {
        error: 'Забагато для одного надходження',
        when: ({ issues }) => issues.length === 0,
      }),
    projectId: z.string(),
    title: z.string().max(200, 'Максимум 200 символів'),
    nickname: z.string().max(100, 'Максимум 100 символів'),
  })
  .superRefine((line, context) => {
    if (line.source === INCOME_SOURCE.ORDER && !line.title.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['title'],
        message: 'Вкажіть назву тайтлу замовлення',
      });
    }
  });

// The date, the season and the year, which the incomes and the support budgets share
export const periodShape = {
  date: z
    .string({ error: REQUIRED_MESSAGE })
    .min(1, REQUIRED_MESSAGE)
    .refine((value) => value >= MIN_DAY, {
      error: 'Дата не може бути раніше 2000 року',
      when: ({ issues }) => issues.length === 0,
    })
    .refine((value) => value <= todayDay(), {
      error: 'Дата не може бути в майбутньому',
      when: ({ issues }) => issues.length === 0,
    }),
  season: z
    .string({ error: REQUIRED_MESSAGE })
    .refine((value) => seasonOptions.some((option) => option.value === value), REQUIRED_MESSAGE),
  year: z.string({ error: REQUIRED_MESSAGE }).min(1, REQUIRED_MESSAGE),
};

export const createIncomeFormSchema = (): z.ZodType<IncomeFormValues, IncomeFormValues> =>
  z.object({
    ...periodShape,
    lines: z.array(lineSchema).min(1),
  });

export const emptyLine = (): IncomeLineValues => ({
  source: INCOME_SOURCE.TEAM_JAR,
  amount: '',
  projectId: '',
  title: '',
  nickname: '',
});

export const newFormValues = (): IncomeFormValues => {
  const date = todayDay();
  const { season, year } = seasonOfDay(date);

  return { date, season, year: String(year), lines: [emptyLine()] };
};

export const toFormValues = (entry: IncomeEntry): IncomeFormValues => ({
  date: entry.date,
  season: entry.season,
  year: String(entry.year),
  lines: [
    {
      source: entry.source,
      amount: kopToUah(entry.amountKop),
      projectId: entry.projectId ?? '',
      title: entry.title ?? '',
      nickname: entry.nickname ?? '',
    },
  ],
});

const toLinePayload = ({
  source,
  amount,
  projectId,
  title,
  nickname,
}: IncomeLineValues): IncomeLinePayload => ({
  source,
  amountKop: parseUah(amount) ?? 0,
  projectId: hasTitle(source) && projectId ? projectId : null,
  title: hasTitle(source) && title.trim() ? title.trim() : null,
  nickname: source === INCOME_SOURCE.LISODAR && nickname.trim() ? nickname.trim() : null,
});

export const toIncomesPayload = ({
  date,
  season,
  year,
  lines,
}: IncomeFormValues): IncomesPayload => ({
  date,
  season,
  year: Number(year),
  lines: lines.map(toLinePayload),
});

export const toIncomePayload = ({
  date,
  season,
  year,
  lines,
}: IncomeFormValues): IncomePayload => ({
  date,
  season,
  year: Number(year),
  ...toLinePayload(lines[0]),
});
