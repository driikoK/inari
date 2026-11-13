import { z } from 'zod';

const CARD_LENGTH = 16;
const MASK = '•••• ';
const MASKED = /^•{4} \d{4}$/;

export const digitsOf = (value: string) => value.replace(/[\s-]/g, '');

// Sixteen digits, with or without spaces and dashes, whether or not they add up
export const hasCardLength = (value: string) =>
  new RegExp(`^\\d{${CARD_LENGTH}}$`).test(digitsOf(value));

// The Luhn sum of Zod's own card check, which catches a mistyped digit. It
// also takes 12 to 19 digits, and the length that is wanted here is 16.
const luhn = z.creditCard();

export const isCardNumber = (value: string) =>
  hasCardLength(value) && luhn.safeParse(digitsOf(value)).success;

// A number can hide in a comment or a link, with spaces or dashes between
// its digits
export const hasCardNumber = (value: string) =>
  (value.match(/\d(?:[\s-]?\d)*/g) ?? []).some(isCardNumber);

export const isHttpsLink = (value: string) => {
  try {
    const url = new URL(value.trim());

    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
};

export const isMasked = (value: string) => MASKED.test(value.trim());

export const maskCard = (value: string) =>
  `${MASK}${digitsOf(value).slice(-4)}`;

// A card number is kept as its last four digits only, a link as it is
export const keepRequisite = (value: string) =>
  isMasked(value)
    ? value.trim()
    : isCardNumber(value)
      ? maskCard(value)
      : value.trim();
