export type PluralForms = [one: string, few: string, many: string];

// «1 лис», «2 лиси», «5 лисів», «11 лисів», «21 лис»
export const plural = (count: number, [one, few, many]: PluralForms) => {
  if (count % 100 >= 11 && count % 100 <= 14) return many;
  if (count % 10 === 1) return one;
  if (count % 10 >= 2 && count % 10 <= 4) return few;

  return many;
};
