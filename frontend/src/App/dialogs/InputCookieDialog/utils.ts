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

export const totalBonusCoins = (values: ValuesType) => {
  const totalBonusCoins: number = Object.values(values.bonus).reduce(
    (sum, item) => sum + item.coin,
    0
  );
  return totalBonusCoins;
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
  nameTitle: string
) => {
  const value = Number(event.target.value);
  const newDubFields = Math.min(Math.max(value, 1), 20);

  const newMain = { ...initialValues.main };
  const newBonus = { ...initialValues.bonus };

  for (const key in newMain) {
    if (key.startsWith('dub')) {
      delete newMain[key];
    }
  }

  for (const key in newBonus) {
    if (key.startsWith('dub')) {
      delete newBonus[key];
    }
  }

  for (let i = 1; i <= newDubFields; i++) {
    newMain[`dub${i}`] = {
      nickname: '',
      nameTitle: nameTitle,
      coin: 0,
      typeRole: 'dub',
    };
    newBonus[`dub${i}`] = {
      nickname: '',
      nameTitle: nameTitle,
      coin: 0,
      typeRole: 'dub',
    };
  }

  setInitialValues((prev) => ({
    ...prev,
    main: newMain,
    bonus: newBonus,
  }));
};

export const handleChangeNameTitle = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setNameTitle: Dispatch<SetStateAction<string>>
) => {
  const value = e.target.value;
  setNameTitle(value);
};

export const handleChangeDubStatus = (
  event: SelectChangeEvent<unknown>,
  setDubStatus: Dispatch<SetStateAction<DubStatusEnum>>
) => {
  const value = event.target.value as DubStatusEnum;
  setDubStatus(value);
};
