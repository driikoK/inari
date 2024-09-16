import { Dispatch, SetStateAction } from 'react';
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

export const getPartialValue = (percent: number, totalValue: number) => {
  return (percent / 100) * totalValue;
};

export const handleChangeCurrentEpisode = (
  event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  setCurrentEpisode: Dispatch<SetStateAction<string>>
) => {
  const value = event.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
  setCurrentEpisode(value);
};

export const isEpisodeValid = (episode: string) => {
  return !isNaN(Number(episode)) && episode.length > 0;
};
