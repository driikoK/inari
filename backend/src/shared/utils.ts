type PickType<T extends object, K extends keyof T> = {
  [P in K]: T[P];
};

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): PickType<T, K> {
  return keys.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as PickType<T, K>);
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const keySet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keySet.has(key as K)),
  ) as Omit<T, K>;
}
