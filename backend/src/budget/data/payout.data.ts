import { z } from 'zod';
import { hasCardNumber, isCardNumber, isHttpsLink, isMasked } from '../card.js';
import { EXPENSE_KIND } from '../enums/index.js';

// Only the last digits of a card are ever kept, so a whole number has no
// business in a field that is stored as it is
export const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Максимум ${max} символів`)
    .refine((value) => !hasCardNumber(value), {
      error: 'Не вказуйте номер карти в цьому полі',
    });

// An already masked number is what an edit sends back untouched
export const requisiteProblem = (
  { kind, requisite }: { kind: EXPENSE_KIND; requisite?: string | null },
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
