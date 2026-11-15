import { z } from 'zod';
import {
  EXPENSE_KIND,
  EXPENSE_SECTION,
  MAX_AMOUNT_KOP,
  SUPPORT_DIRECTION,
} from '../enums/index.js';
import { requisiteProblem, text } from './payout.data.js';
import { day } from './period.data.js';

const lineFields = {
  kind: z.enum(EXPENSE_KIND, { error: 'Оберіть, що саме виплачується' }),
  amountKop: z
    .int('Сума має бути в копійках, цілим числом')
    .min(1, 'Сума має бути більшою за нуль')
    .max(MAX_AMOUNT_KOP, 'Забагато для одного видатку'),
  // A payout of crumbs is written only by fulfilling a request
  section: z.enum([EXPENSE_SECTION.SUPPORT, EXPENSE_SECTION.ORDERS], {
    error: 'Оберіть розділ бюджету',
  }),
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
