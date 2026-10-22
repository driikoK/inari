import { z } from 'zod';
import { SEASON } from '../../shared/index.js';
import { MIN_BUDGET_DAY } from '../enums/index.js';

export const day = z.iso
  .date({ error: 'Вкажіть коректну дату' })
  .refine((value) => value >= MIN_BUDGET_DAY, {
    error: 'Дата не може бути раніше 2000 року',
    when: ({ issues }) => issues.length === 0,
  });

export const period = {
  date: day,
  season: z.enum(SEASON, { error: 'Оберіть сезон' }),
  year: z
    .int('Вкажіть рік')
    .min(2000, 'Рік не може бути раніше 2000')
    .max(2100, 'Забагато'),
};
