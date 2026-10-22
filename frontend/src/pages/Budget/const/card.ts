const MASKED = /^•{4} \d{4}$/;

export const digitsOf = (value: string) => value.replace(/[\s-]/g, '');

// The same check as on the server: 16 digits that agree with the Luhn sum
export const isCardNumber = (value: string) => {
  const digits = digitsOf(value);

  if (!/^\d{16}$/.test(digits)) return false;

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
