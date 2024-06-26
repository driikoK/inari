import { Dispatch, SetStateAction } from 'react';
import { DubStatusEnum, ValuesType } from './types';
import { SelectChangeEvent } from '@mui/material';

export const totalMainCoins = (values: ValuesType) => {
  const totalMainCoins: number = Object.values(values.main).reduce(
    (sum, item) => sum + item.coin,
    0
  );
  return totalMainCoins;
};

export const totalKbs = (values: ValuesType) => {
  const sumOfKbs: number = values.dubs.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  return sumOfKbs;
};

export const handleChangeDubFields = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  initialValues: ValuesType,
  setInitialValues: Dispatch<SetStateAction<ValuesType>>,
  nameTitle: string,
  currentEpisode: number,
) => {
  const value = Number(event.target.value);
  const newDubFields = Math.min(Math.max(value, 1), 20);

  const newMain = { ...initialValues.main };

  for (const key in newMain) {
    if (key.startsWith('dub')) {
      delete newMain[key];
    }
  }

  for (let i = 1; i <= newDubFields; i++) {
    newMain[`dub${i}`] = {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'dub',
      currentEpisode,
    };
  }

  setInitialValues((prev) => ({
    ...prev,
    main: newMain,
  }));
};

export const handleChangeDubStatus = (
  event: SelectChangeEvent<unknown>,
  setDubStatus: Dispatch<SetStateAction<DubStatusEnum>>
) => {
  const value = event.target.value as DubStatusEnum;
  setDubStatus(value);
};

export const getPartialValue = (percent: number, totalValue: number) => {
  return (percent / 100) * totalValue;
}
