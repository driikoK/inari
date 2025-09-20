import { useEffect, useState } from 'react';
import { UseFormWatch, Path } from 'react-hook-form';

import { CoinsType } from '@/types';
import { FieldFormValue } from '../types';

type MembersInfoWithCoins = {
  dubs?: FieldFormValue[];
  releasers?: FieldFormValue[];
  fixers?: FieldFormValue[];
};

type Props<T extends { membersInfo: MembersInfoWithCoins }> = {
  watch: UseFormWatch<T>;
  defaultCoins: CoinsType;
};

const useCoinsCalculation = <T extends { membersInfo: MembersInfoWithCoins }>({
  watch,
  defaultCoins,
}: Props<T>) => {
  const watchDubs = (watch('membersInfo.dubs' as Path<T>) ?? []) as FieldFormValue[];
  const watchReleasers = (watch('membersInfo.releasers' as Path<T>) ?? []) as FieldFormValue[];
  const watchFixers = (watch('membersInfo.fixers' as Path<T>) ?? []) as FieldFormValue[];

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
