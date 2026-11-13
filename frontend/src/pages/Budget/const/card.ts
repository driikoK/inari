import { z } from 'zod';

const MASKED = /^•{4} \d{4}$/;

export const digitsOf = (value: string) => value.replace(/[\s-]/g, '');

// Sixteen digits, with or without spaces and dashes, whether or not they add up
export const hasCardLength = (value: string) => /^\d{16}$/.test(digitsOf(value));

// The same check as on the server: the Luhn sum of Zod's own card check, which
// takes 12 to 19 digits, and the length that is wanted here is 16
const luhn = z.creditCard();

export const isCardNumber = (value: string) =>
  hasCardLength(value) && luhn.safeParse(digitsOf(value)).success;

// The same check as on the server: a whole number in a field that is saved as it is
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

// A number that was saved comes back as its last four digits
export const isMasked = (value: string) => MASKED.test(value.trim());
