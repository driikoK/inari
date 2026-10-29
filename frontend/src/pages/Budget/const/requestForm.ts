import { z } from 'zod';

import type { BudgetSummary, RequestPayload } from '@/stores/useBudgetStore';
import { EXPENSE_KIND } from '@/types';
import { hasCardNumber } from './card';
import { requisiteProblem } from './expenseForm';
import { MAX_KOP, parseCrumbs, parseUah } from './options';

export const REQUEST_KINDS = [EXPENSE_KIND.CARD, EXPENSE_KIND.DONATION, EXPENSE_KIND.DEVELOPMENT];

export interface RequestSectionValues {
  amount: string;
  requisite: string;
}

export type RequestFormValues = { isOrder: boolean; place: string; comment: string } & Record<
  EXPENSE_KIND,
  RequestSectionValues
>;

// The budget of a title an order is paid from
export interface OrderPlace {
  key: string;
  title: string;
  projectId?: string;
  balanceKop: number;
}

export const orderPlaces = (summary: BudgetSummary | null): OrderPlace[] =>
  (summary?.orders ?? []).map(({ key, title, projectId, balanceKop }) => ({
    key,
    title,
    ...(projectId && { projectId }),
    balanceKop,
  }));

const emptySection = (): RequestSectionValues => ({ amount: '', requisite: '' });

export const newRequestValues = (): RequestFormValues => ({
  isOrder: false,
  place: '',
  comment: '',
  [EXPENSE_KIND.CARD]: emptySection(),
  [EXPENSE_KIND.DONATION]: emptySection(),
  [EXPENSE_KIND.DEVELOPMENT]: emptySection(),
});

// A section counts when it has an amount, the others are left out
export const isFilled = ({ amount }: RequestSectionValues) => amount.trim() !== '';

const isTouched = ({ amount, requisite }: RequestSectionValues) =>
  amount.trim() !== '' || requisite.trim() !== '';

const sectionSchema = z.object({
  amount: z.string(),
  requisite: z.string().max(300, 'Максимум 300 символів'),
});

export const createRequestFormSchema = (
  places: OrderPlace[],
): z.ZodType<RequestFormValues, RequestFormValues> =>
  z
    .object({
      isOrder: z.boolean(),
      place: z.string(),
      comment: z
        .string()
        .max(500, 'Максимум 500 символів')
        .refine((value) => !hasCardNumber(value), 'Не вказуйте номер карти в цьому полі'),
      [EXPENSE_KIND.CARD]: sectionSchema,
      [EXPENSE_KIND.DONATION]: sectionSchema,
      [EXPENSE_KIND.DEVELOPMENT]: sectionSchema,
    })
    .superRefine((values, context) => {
      if (values.isOrder && !places.some(({ key }) => key === values.place)) {
        context.addIssue({ code: 'custom', path: ['place'], message: 'Оберіть тайтл замовлення' });
      }

      for (const kind of REQUEST_KINDS) {
        const section = values[kind];

        if (!isTouched(section)) continue;

        const complain = (field: keyof RequestSectionValues, message: string) =>
          context.addIssue({ code: 'custom', path: [kind, field], message });

        if (!isFilled(section)) {
          complain('amount', values.isOrder ? 'Вкажіть суму' : 'Вкажіть кількість крихт');
        } else if (values.isOrder) {
          const kop = parseUah(section.amount);

          if (kop === null) complain('amount', 'Введіть суму, наприклад 1500 або 1500,50');
          else if (kop > MAX_KOP) complain('amount', 'Забагато для одного запиту');
        } else if (parseCrumbs(section.amount) === null) {
          complain('amount', 'Введіть кількість крихт, наприклад 120 або 12,5');
        }

        const problem = requisiteProblem(kind, section.requisite, false);

        if (problem) complain('requisite', problem);
      }
    });

export const toRequestPayload = (
  { isOrder, place, comment, ...sections }: RequestFormValues,
  places: OrderPlace[],
): RequestPayload => {
  const budget = isOrder ? places.find(({ key }) => key === place) : undefined;

  return {
    isOrder,
    projectId: budget?.projectId ?? null,
    title: budget?.title ?? null,
    comment: comment.trim() || null,
    lines: REQUEST_KINDS.filter((kind) => isFilled(sections[kind])).map((kind) => ({
      kind,
      crumbs: isOrder ? null : (parseCrumbs(sections[kind].amount) ?? 0),
      amountKop: isOrder ? (parseUah(sections[kind].amount) ?? 0) : null,
      requisite: kind === EXPENSE_KIND.DEVELOPMENT ? null : sections[kind].requisite.trim(),
    })),
  };
};
