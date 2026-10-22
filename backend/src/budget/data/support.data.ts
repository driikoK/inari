import { z } from 'zod';
import { MAX_AMOUNT_KOP, SUPPORT_DIRECTION } from '../enums/index.js';
import { period } from './period.data.js';

const target = z.object({
  direction: z.enum(SUPPORT_DIRECTION, { error: 'Оберіть напрямок' }),
  targetKop: z
    .int('Сума має бути в копійках, цілим числом')
    .min(0, 'Бюджет напрямку не може бути від’ємним')
    .max(MAX_AMOUNT_KOP, 'Забагато для одного напрямку'),
});

// The directions get their new budgets out of the jar of one season
export const UpdateSupportData = z.object({
  ...period,
  targets: z
    .array(target)
    .min(1, 'Вкажіть хоча б один напрямок')
    .max(Object.values(SUPPORT_DIRECTION).length)
    .refine(
      (targets) =>
        new Set(targets.map(({ direction }) => direction)).size ===
        targets.length,
      'Напрямок вказано двічі',
    ),
});

export type UpdateSupportData = z.infer<typeof UpdateSupportData>;
