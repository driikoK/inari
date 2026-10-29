import { z } from 'zod';

import { todayDay } from '@/pages/Projects/const/options';
import type {
  BudgetSummary,
  ExpenseEntry,
  ExpenseLinePayload,
  ExpensePayload,
  ExpensesPayload,
} from '@/stores/useBudgetStore';
import { EXPENSE_KIND, EXPENSE_SECTION, type SUPPORT_DIRECTION } from '@/types';
import { hasCardNumber, isCardNumber, isHttpsLink, isMasked } from './card';
import { periodShape } from './form';
import { directionLabel, kopToUah, MAX_KOP, normalizeName, parseUah } from './options';

const NO_CARD_MESSAGE = 'Не вказуйте номер карти в цьому полі';

export const SUPPORT_GROUP = 'Печивко підтримки';
export const ORDERS_GROUP = 'Тістечка замовлень';

// A budget that money can be paid out of, with what it holds now
export interface BudgetPlace {
  key: string;
  label: string;
  group: string;
  balanceKop: number;
  section: EXPENSE_SECTION;
  direction?: SUPPORT_DIRECTION;
  projectId?: string;
  title?: string;
}

export const budgetPlaces = (summary: BudgetSummary | null): BudgetPlace[] =>
  summary
    ? [
        ...summary.support.map(({ direction, balanceKop }) => ({
          key: `support:${direction}`,
          label: directionLabel(direction),
          group: SUPPORT_GROUP,
          balanceKop,
          section: EXPENSE_SECTION.SUPPORT,
          direction,
        })),
        ...summary.orders.map(({ key, title, projectId, balanceKop }) => ({
          key: `orders:${key}`,
          label: title,
          group: ORDERS_GROUP,
          balanceKop,
          section: EXPENSE_SECTION.ORDERS,
          ...(projectId && { projectId }),
          title,
        })),
      ]
    : [];

export interface PayoutValues {
  amount: string;
  requisite: string;
  nickname: string;
  place: string;
}

export type TreatFormValues = { date: string; comment: string } & Record<
  EXPENSE_KIND,
  PayoutValues
>;

export const PAYOUT_KINDS = [EXPENSE_KIND.CARD, EXPENSE_KIND.DONATION, EXPENSE_KIND.DEVELOPMENT];

export const emptyPayout = (): PayoutValues => ({
  amount: '',
  requisite: '',
  nickname: '',
  place: '',
});

export const newTreatValues = (): TreatFormValues => ({
  date: todayDay(),
  comment: '',
  [EXPENSE_KIND.CARD]: emptyPayout(),
  [EXPENSE_KIND.DONATION]: emptyPayout(),
  [EXPENSE_KIND.DEVELOPMENT]: emptyPayout(),
});

// A section counts when it has an amount, the others are left out
export const isFilled = ({ amount }: PayoutValues) => amount.trim() !== '';

const isTouched = ({ amount, requisite, nickname, place }: PayoutValues) =>
  [amount, requisite, nickname, place].some((value) => value.trim() !== '');

// A masked number is what an edit sends back, a new payout has to bring a real one
export const requisiteProblem = (kind: EXPENSE_KIND, value: string, isEdit: boolean) => {
  const text = value.trim();

  if (kind === EXPENSE_KIND.DEVELOPMENT) return null;

  if (!text) {
    return kind === EXPENSE_KIND.CARD
      ? 'Вкажіть номер карти'
      : 'Вкажіть номер карти або посилання на банку';
  }

  if (isCardNumber(text) || (isEdit && isMasked(text))) return null;

  if (kind === EXPENSE_KIND.CARD) return 'Номер карти — 16 цифр, перевірте, чи немає помилки';

  if (!isHttpsLink(text)) return 'Вкажіть номер карти або посилання, що починається з https://';

  return hasCardNumber(text) ? 'Посилання не має містити номер карти' : null;
};

const payoutSchema = z.object({
  amount: z.string(),
  requisite: z.string().max(300, 'Максимум 300 символів'),
  nickname: z
    .string()
    .max(100, 'Максимум 100 символів')
    .refine((value) => !hasCardNumber(value), NO_CARD_MESSAGE),
  place: z.string(),
});

export const createTreatFormSchema = (
  places: BudgetPlace[],
  isEdit = false,
): z.ZodType<TreatFormValues, TreatFormValues> =>
  z
    .object({
      date: periodShape.date,
      comment: z
        .string()
        .max(500, 'Максимум 500 символів')
        .refine((value) => !hasCardNumber(value), NO_CARD_MESSAGE),
      [EXPENSE_KIND.CARD]: payoutSchema,
      [EXPENSE_KIND.DONATION]: payoutSchema,
      [EXPENSE_KIND.DEVELOPMENT]: payoutSchema,
    })
    .superRefine((values, context) => {
      for (const kind of PAYOUT_KINDS) {
        const payout = values[kind];

        if (!isTouched(payout)) continue;

        const complain = (field: keyof PayoutValues, message: string) =>
          context.addIssue({ code: 'custom', path: [kind, field], message });
        const kop = parseUah(payout.amount);

        if (!isFilled(payout)) complain('amount', 'Вкажіть суму');
        else if (kop === null) complain('amount', 'Введіть суму, наприклад 1500 або 1500,50');
        else if (kop > MAX_KOP) complain('amount', 'Забагато для одного видатку');

        if (!payout.nickname.trim()) complain('nickname', 'Вкажіть ім’я учасника');

        if (!places.some(({ key }) => key === payout.place)) {
          complain('place', 'Оберіть розділ бюджету');
        }

        const problem = requisiteProblem(kind, payout.requisite, isEdit);

        if (problem) complain('requisite', problem);
      }
    });

const toLinePayload = (
  kind: EXPENSE_KIND,
  { amount, requisite, nickname, place }: PayoutValues,
  places: BudgetPlace[],
): ExpenseLinePayload => {
  const budget = places.find(({ key }) => key === place);

  return {
    kind,
    amountKop: parseUah(amount) ?? 0,
    section: budget?.section ?? EXPENSE_SECTION.SUPPORT,
    direction: budget?.direction ?? null,
    projectId: budget?.projectId ?? null,
    title: budget?.title ?? null,
    nickname: nickname.trim(),
    requisite: kind === EXPENSE_KIND.DEVELOPMENT ? null : requisite.trim(),
  };
};

export const toExpensesPayload = (
  values: TreatFormValues,
  places: BudgetPlace[],
): ExpensesPayload => ({
  date: values.date,
  comment: values.comment.trim() || null,
  lines: PAYOUT_KINDS.filter((kind) => isFilled(values[kind])).map((kind) =>
    toLinePayload(kind, values[kind], places),
  ),
});

export const toExpensePayload = (
  values: TreatFormValues,
  kind: EXPENSE_KIND,
  places: BudgetPlace[],
): ExpensePayload => ({
  date: values.date,
  comment: values.comment.trim() || null,
  ...toLinePayload(kind, values[kind], places),
});

export const placeKeyOf = ({ section, direction, projectId, title }: ExpenseEntry) =>
  section === EXPENSE_SECTION.SUPPORT
    ? `support:${direction}`
    : `orders:${projectId ? `project:${projectId}` : `title:${normalizeName(title ?? '')}`}`;

// An edit shows the one section the payout belongs to
export const toTreatValues = (entry: ExpenseEntry): TreatFormValues => ({
  ...newTreatValues(),
  date: entry.date,
  comment: entry.comment ?? '',
  [entry.kind]: {
    amount: kopToUah(entry.amountKop),
    requisite: entry.requisite ?? '',
    nickname: entry.nickname,
    place: placeKeyOf(entry),
  },
});
