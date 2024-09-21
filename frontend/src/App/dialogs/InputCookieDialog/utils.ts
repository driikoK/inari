import { ValuesType } from './types';

export const totalMainCoins = (values: ValuesType) => {
  const totalMainCoins: number = Object.values(values.main).reduce(
    (sum, item) => sum + item.coins,
    0
  );
  return totalMainCoins;
};

export const totalKbs = (values: ValuesType) => {
  const sumOfKbs: number = values.dubs.reduce(
    (accumulator, currentValue) => accumulator + Number(currentValue),
    0
  );
  return sumOfKbs;
};
