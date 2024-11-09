import { useEffect, useState } from 'react';
import { UseFormWatch } from 'react-hook-form';

import { CoinsType } from '@/types';
import { CreateTrackFormValues, FieldFormValue } from '@/App/dialogs/InputCookieDialog/types';

type Props = {
  watch: UseFormWatch<CreateTrackFormValues>;
  defaultCoins: CoinsType;
};

const useCoinsCalculation = ({ watch, defaultCoins }: Props) => {
  const watchDubs = watch('membersInfo.dubs');
  const watchReleasers = watch('membersInfo.releasers');

  const calculateCoinsSpent = (items: FieldFormValue[]) =>
    items.reduce((sum, item) => sum + Number(item.coins || '0'), 0);

  const isDoubleDubs = watchDubs.length <= 2;
  const dubsSpent = calculateCoinsSpent(watchDubs);
  const releasersSpent = calculateCoinsSpent(watchReleasers);

  const [coinsForDubs, setCoinsForDubs] = useState(
    isDoubleDubs ? defaultCoins.dub.double : defaultCoins.dub.multi
  );
  const [coinsForReleasers, setCoinsForReleasers] = useState(defaultCoins.releaser);

  useEffect(() => {
    const dubsCoinsLeft =
      (isDoubleDubs ? defaultCoins.dub.double : defaultCoins.dub.multi) - dubsSpent;
    setCoinsForDubs(dubsCoinsLeft > 0 ? dubsCoinsLeft : 0);
  }, [dubsSpent, watchDubs.length, isDoubleDubs, defaultCoins]);

  useEffect(() => {
    const releasersCoinsLeft = defaultCoins.releaser - releasersSpent;
    setCoinsForReleasers(releasersCoinsLeft > 0 ? releasersCoinsLeft : 0);
  }, [releasersSpent, watchReleasers.length, defaultCoins]);

  const prettifyValue = (value: number) => (value % 1 === 0 ? value : value.toFixed(3));

  return {
    coinsForDubs: prettifyValue(coinsForDubs),
    coinsForReleasers: prettifyValue(coinsForReleasers),
  };
};

export default useCoinsCalculation;
