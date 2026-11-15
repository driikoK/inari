import { z } from 'zod';
import { EXPENSE_KIND, MAX_AMOUNT_KOP } from '../enums/index.js';
import { requisiteProblem, text } from './payout.data.js';

const MAX_CRUMBS = 1_000_000;

const crumbs = z
  .number({ error: 'Вкажіть кількість крихт' })
  .positive('Кількість крихт має бути більшою за нуль')
  .max(MAX_CRUMBS, 'Забагато для одного запиту')
  .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6, {
    error: 'Не більше трьох знаків після коми',
  });

const amountKop = z
  .int('Сума має бути в копійках, цілим числом')
  .min(1, 'Сума має бути більшою за нуль')
  .max(MAX_AMOUNT_KOP, 'Забагато для одного запиту');

const line = z.object({
  kind: z.enum(EXPENSE_KIND, { error: 'Оберіть, що саме вивести' }),
  crumbs: crumbs.nullish(),
  amountKop: amountKop.nullish(),
  requisite: z.string().trim().max(300, 'Максимум 300 символів').nullish(),
});

// A request for crumbs counts crumbs, and one for an order, which does not
// touch the crumbs, counts hryvnias taken from the budget of a title
export const CreateRequestData = z
  .object({
    isOrder: z.boolean(),
    projectId: z.string().trim().min(1).nullish(),
    title: text(200).nullish(),
    comment: text(500).nullish(),
    lines: z
      .array(line)
      .min(1, 'Заповніть хоча б один розділ')
      .max(Object.values(EXPENSE_KIND).length),
  })
  .superRefine(({ isOrder, projectId, title, lines }, context) => {
    if (isOrder && !projectId && !title) {
      context.addIssue({
        code: 'custom',
        path: ['title'],
        message: 'Оберіть тайтл замовлення',
      });
    }

    if (new Set(lines.map(({ kind }) => kind)).size !== lines.length) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message: 'Розділ вказано двічі',
      });
    }

    lines.forEach((item, index) => {
      const complain = (field: string, message: string) =>
        context.addIssue({
          code: 'custom',
          path: ['lines', index, field],
          message,
        });

      if (isOrder) {
        if (item.amountKop == null) complain('amountKop', 'Вкажіть суму');
        if (item.crumbs != null) {
          complain('crumbs', 'Запит на замовлення рахується в гривнях');
        }
      } else {
        if (item.crumbs == null) complain('crumbs', 'Вкажіть кількість крихт');
        if (item.amountKop != null) {
          complain('amountKop', 'Запит на крихти рахується в крихтах');
        }
      }

      const problem = requisiteProblem(item, false);

      if (problem) complain('requisite', problem);
    });
  });

// Only an order is paid in hryvnias, and the admin may correct the sum
export const FulfilRequestData = z.object({
  amountKop: amountKop.nullish(),
});

export type CreateRequestData = z.infer<typeof CreateRequestData>;
export type FulfilRequestData = z.infer<typeof FulfilRequestData>;
