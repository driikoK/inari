import { z } from 'zod';

import { todayDay } from '@/pages/Projects/const/options';
import type { BudgetSummary, SupportPayload } from '@/stores/useBudgetStore';
import { SUPPORT_DIRECTION } from '@/types';
import { periodShape } from './form';
import { kopToUah, MAX_KOP, parseUahOrZero, seasonOfDay } from './options';

export interface SupportFormValues {
  date: string;
  season: string;
  year: string;
  targets: Record<SUPPORT_DIRECTION, string>;
}

const DIRECTIONS = Object.values(SUPPORT_DIRECTION);

const targetsShape = Object.fromEntries(
  DIRECTIONS.map((direction) => [direction, z.string()]),
) as Record<SUPPORT_DIRECTION, z.ZodString>;

export const createSupportFormSchema = (): z.ZodType<SupportFormValues, SupportFormValues> =>
  z
    .object({
      ...periodShape,
      targets: z.object(targetsShape),
    })
    .superRefine(({ targets }, context) => {
      for (const direction of DIRECTIONS) {
        const kop = parseUahOrZero(targets[direction]);
        const complain = (message: string) =>
          context.addIssue({ code: 'custom', path: ['targets', direction], message });

        if (kop === null) complain('Введіть суму, наприклад 1500 або 0');
        else if (kop > MAX_KOP) complain('Забагато для одного напрямку');
      }
    });

export const balanceOf = (summary: BudgetSummary, direction: SUPPORT_DIRECTION) =>
  summary.support.find((line) => line.direction === direction)?.balanceKop ?? 0;

// Every direction starts at what it holds now, so only what is changed is sent
export const newSupportValues = (summary: BudgetSummary): SupportFormValues => {
  const date = todayDay();
  const { season, year } = seasonOfDay(date);

  return {
    date,
    season,
    year: String(year),
    targets: Object.fromEntries(
      DIRECTIONS.map((direction) => [direction, kopToUah(balanceOf(summary, direction))]),
    ) as Record<SUPPORT_DIRECTION, string>,
  };
};

// Only the directions the admin changed are sent, so a direction that somebody else changed in the
// meantime is not put back. How much that moves is for the server to say, see previewSupport.
export const toSupportPayload = (
  { date, season, year, targets }: SupportFormValues,
  summary: BudgetSummary,
): SupportPayload => ({
  date,
  season,
  year: Number(year),
  targets: DIRECTIONS.map((direction) => ({
    direction,
    targetKop: parseUahOrZero(targets[direction]) ?? 0,
  })).filter(({ direction, targetKop }) => targetKop !== balanceOf(summary, direction)),
});
