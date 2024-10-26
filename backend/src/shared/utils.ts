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
