import { useEffect, useState } from 'react';
import { UseFormWatch } from 'react-hook-form';

import { CoinsType } from '@/types';
import { CreateTrackFormValues, FieldFormValue } from './types';

type Props = {
  watch: UseFormWatch<CreateTrackFormValues>;
  defaultCoins: CoinsType;
};

const useCoinsCalculation = ({ watch, defaultCoins }: Props) => {
  const watchDubs = watch('membersInfo.dubs');
  const watchReleasers = watch('membersInfo.releasers');
  const watchFixers = watch('membersInfo.fixers');

  const calculateCoinsSpent = (items: FieldFormValue[]) =>
    items.reduce((sum, item) => sum + Number(item.coins || '0'), 0);

  const isDoubleDubs = watchDubs.length <= 2;
  const dubsSpent = calculateCoinsSpent(watchDubs);
  const releasersSpent = calculateCoinsSpent(watchReleasers);
  const fixersSpent = calculateCoinsSpent(watchFixers);

  const [coinsForDubs, setCoinsForDubs] = useState(
    isDoubleDubs ? defaultCoins.dub.double : defaultCoins.dub.multi
  );
  const [coinsForReleasers, setCoinsForReleasers] = useState(defaultCoins.releaser);
  const [coinsForFixers, setCoinsForFixers] = useState(defaultCoins.fixer);

  useEffect(() => {
    const dubsCoinsLeft =
      (isDoubleDubs ? defaultCoins.dub.double : defaultCoins.dub.multi) - dubsSpent;
    setCoinsForDubs(dubsCoinsLeft > 0 ? dubsCoinsLeft : 0);
  }, [dubsSpent, watchDubs.length, isDoubleDubs, defaultCoins]);

  useEffect(() => {
    const releasersCoinsLeft = defaultCoins.releaser - releasersSpent;
    setCoinsForReleasers(releasersCoinsLeft > 0 ? releasersCoinsLeft : 0);
  }, [releasersSpent, watchReleasers.length, defaultCoins]);

  useEffect(() => {
    const fixersCoinsLeft = defaultCoins.fixer - fixersSpent;
    setCoinsForFixers(fixersCoinsLeft > 0 ? fixersCoinsLeft : 0);
  }, [fixersSpent, watchFixers.length, defaultCoins]);

  const prettifyValue = (value: number) => {
    if (value % 1 === 0) return value;

    if (value.toFixed(3).toString().endsWith('00'))
      return Number(value.toFixed(3).toString().slice(0, -2));

    return value.toFixed(3);
  };

  return {
    coinsForDubs: prettifyValue(coinsForDubs),
    coinsForReleasers: prettifyValue(coinsForReleasers),
    coinsForFixers: prettifyValue(coinsForFixers),
  };
};

export default useCoinsCalculation;
