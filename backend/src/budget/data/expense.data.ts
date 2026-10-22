import { z } from 'zod';
import { hasCardNumber, isCardNumber, isHttpsLink, isMasked } from '../card.js';
import {
  EXPENSE_KIND,
  EXPENSE_SECTION,
  MAX_AMOUNT_KOP,
  SUPPORT_DIRECTION,
} from '../enums/index.js';
import { day } from './period.data.js';

// Only the last digits of a card are ever kept, so a whole number has no
// business in a field that is stored as it is
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Максимум ${max} символів`)
    .refine((value) => !hasCardNumber(value), {
      error: 'Не вказуйте номер карти в цьому полі',
    });

const lineFields = {
  kind: z.enum(EXPENSE_KIND, { error: 'Оберіть, що саме виплачується' }),
  amountKop: z
    .int('Сума має бути в копійках, цілим числом')
    .min(1, 'Сума має бути більшою за нуль')
    .max(MAX_AMOUNT_KOP, 'Забагато для одного видатку'),
  section: z.enum(EXPENSE_SECTION, { error: 'Оберіть розділ бюджету' }),
  direction: z.enum(SUPPORT_DIRECTION).nullish(),
  projectId: z.string().trim().min(1).nullish(),
  title: text(200).nullish(),
  nickname: z
    .string({ error: 'Вкажіть ім’я учасника' })
    .trim()
    .min(1, 'Вкажіть ім’я учасника')
    .pipe(text(100)),
  requisite: z.string().trim().max(300, 'Максимум 300 символів').nullish(),
  comment: text(500).nullish(),
};

type LineShape = {
  kind: EXPENSE_KIND;
  section: EXPENSE_SECTION;
  direction?: SUPPORT_DIRECTION | null;
  projectId?: string | null;
  title?: string | null;
  requisite?: string | null;
};

// An already masked number is what an edit sends back untouched
const requisiteProblem = (
  { kind, requisite }: LineShape,
  isUpdate: boolean,
) => {
  if (kind === EXPENSE_KIND.DEVELOPMENT) return null;
  if (!requisite) {
    return kind === EXPENSE_KIND.CARD
      ? 'Вкажіть номер карти'
      : 'Вкажіть номер карти або посилання на банку';
  }

  if (isCardNumber(requisite) || (isUpdate && isMasked(requisite))) return null;

  if (kind === EXPENSE_KIND.CARD) {
    return 'Номер карти — 16 цифр, перевірте, чи немає помилки';
  }

  if (!isHttpsLink(requisite)) {
    return 'Вкажіть номер карти або посилання, що починається з https://';
  }

  return hasCardNumber(requisite)
    ? 'Посилання не має містити номер карти'
    : null;
};

const checkLine =
  (isUpdate: boolean) => (line: LineShape, context: z.RefinementCtx) => {
    if (line.section === EXPENSE_SECTION.SUPPORT && !line.direction) {
      context.addIssue({
        code: 'custom',
        path: ['direction'],
        message: 'Оберіть напрямок підтримки',
      });
    }

    if (
      line.section === EXPENSE_SECTION.ORDERS &&
      !line.projectId &&
      !line.title
    ) {
      context.addIssue({
        code: 'custom',
        path: ['title'],
        message: 'Вкажіть тайтл замовлення',
      });
    }

    const problem = requisiteProblem(line, isUpdate);

    if (problem) {
      context.addIssue({
        code: 'custom',
        path: ['requisite'],
        message: problem,
      });
    }
  };

const { comment: _comment, ...lineWithoutComment } = lineFields;

const line = z.object(lineWithoutComment).superRefine(checkLine(false));

export const CreateExpensesData = z.object({
  date: day,
  comment: lineFields.comment,
  lines: z
    .array(line)
    .min(1, 'Заповніть хоча б один розділ')
    .max(20, 'Забагато видатків за раз'),
});

export const UpdateExpenseData = z
  .object({ date: day, ...lineFields })
  .superRefine(checkLine(true));

export type ExpenseLineData = z.infer<typeof line>;
export type CreateExpensesData = z.infer<typeof CreateExpensesData>;
export type UpdateExpenseData = z.infer<typeof UpdateExpenseData>;
