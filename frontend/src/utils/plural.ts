export type PluralForms = [one: string, few: string, many: string];

export const plural = (count: number, [one, few, many]: PluralForms) => {
  if (count % 100 >= 11 && count % 100 <= 14) return many;
  if (count % 10 === 1) return one;
  if (count % 10 >= 2 && count % 10 <= 4) return few;

  return many;
};

export const crumbsWord = (value: number) => {
  const shown = Math.round(Math.abs(value) * 1000) / 1000;

  return Number.isInteger(shown) ? plural(shown, ['крихта', 'крихти', 'крихт']) : 'крихти';
};
