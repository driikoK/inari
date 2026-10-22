const CARD_LENGTH = 16;
const MASK = '•••• ';
const MASKED = /^•{4} \d{4}$/;

export const digitsOf = (value: string) => value.replace(/[\s-]/g, '');

// Cards are checked by the Luhn sum, which catches a mistyped digit
export const isCardNumber = (value: string) => {
  const digits = digitsOf(value);

  if (!new RegExp(`^\\d{${CARD_LENGTH}}$`).test(digits)) return false;

  let sum = 0;

  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits[digits.length - 1 - index]);

    if (index % 2 === 1) {
      digit *= 2;

      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
};

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
