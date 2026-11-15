type PickType<T extends object, K extends keyof T> = {
  [P in K]: T[P];
};

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): PickType<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as PickType<T, K>,
  );
}

export function splitOptionals<K extends string>(
  fields: Record<K, string | null | undefined>,
) {
  const set: Partial<Record<K, string>> = {};
  const unset: Partial<Record<K, ''>> = {};

  for (const key of Object.keys(fields) as K[]) {
    const value = fields[key];

    if (typeof value === 'string' && value.trim() !== '') set[key] = value;
    else unset[key] = '';
  }

  return { set, unset };
}

// «1 трек», «2 треки», «5 треків», «11 треків», «21 трек»
export const plural = (
  count: number,
  [one, few, many]: [one: string, few: string, many: string],
) => {
  if (count % 100 >= 11 && count % 100 <= 14) return many;
  if (count % 10 === 1) return one;
  if (count % 10 >= 2 && count % 10 <= 4) return few;

  return many;
};

export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const keySet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keySet.has(key as K)),
  ) as Omit<T, K>;
}
