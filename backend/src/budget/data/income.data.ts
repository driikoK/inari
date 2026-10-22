import { z } from 'zod';
import { INCOME_SOURCE, MAX_AMOUNT_KOP } from '../enums/index.js';
import { period } from './period.data.js';

const optionalText = (max: number) =>
  z.string().trim().max(max, `Максимум ${max} символів`).nullish();

const lineFields = {
  source: z.enum(INCOME_SOURCE, { error: 'Оберіть джерело' }),
  amountKop: z
    .int('Сума має бути в копійках, цілим числом')
    .min(1, 'Сума має бути більшою за нуль')
    .max(MAX_AMOUNT_KOP, 'Забагато для одного надходження'),
  projectId: z.string().trim().min(1).nullish(),
  title: optionalText(200),
  nickname: optionalText(100),
};

const orderNeedsTitle = {
  check: (line: {
    source: INCOME_SOURCE;
    projectId?: string | null;
    title?: string | null;
  }) => line.source !== INCOME_SOURCE.ORDER || !!line.projectId || !!line.title,
  options: { error: 'Вкажіть назву тайтлу замовлення', path: ['title'] },
};

const line = z
  .object(lineFields)
  .refine(orderNeedsTitle.check, orderNeedsTitle.options);

export const CreateIncomesData = z.object({
  ...period,
  lines: z
    .array(line)
    .min(1, 'Додайте хоча б одне надходження')
    .max(20, 'Забагато надходжень за раз'),
});

export const UpdateIncomeData = z
  .object({ ...period, ...lineFields })
  .refine(orderNeedsTitle.check, orderNeedsTitle.options);

export type IncomeLineData = z.infer<typeof line>;
export type CreateIncomesData = z.infer<typeof CreateIncomesData>;
export type UpdateIncomeData = z.infer<typeof UpdateIncomeData>;
