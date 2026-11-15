import { FC, useEffect, useState } from 'react';

import { FormControlLabel, Switch } from '@mui/material';

import { useMembersStore } from '@/stores';
import { formatCoins, convertSeasonEngToUkr } from '@/utils/convert';
import { notifyFailure } from '@/utils/request';
import styles from './styles.module.scss';

const INCLUDE_GUESTS_KEY = 'rating.includeGuests';

const readIncludeGuests = (): boolean => {
  try {
    return localStorage.getItem(INCLUDE_GUESTS_KEY) !== 'false';
  } catch {
    return true;
  }
};

const saveIncludeGuests = (value: boolean) => {
  try {
    localStorage.setItem(INCLUDE_GUESTS_KEY, String(value));
  } catch {
    // The choice just is not remembered
  }
};

export const CoinsTotalSummary: FC = () => {
  const { season, year } = useMembersStore((state) => state.appliedFilters);
  const coinsTotal = useMembersStore((state) => state.coinsTotal);
  const isLoading = useMembersStore((state) => state.isCoinsTotalLoading);
  const getCoinsTotal = useMembersStore((state) => state.getCoinsTotal);
  const clearCoinsTotal = useMembersStore((state) => state.clearCoinsTotal);

  const [includeGuests, setIncludeGuests] = useState(readIncludeGuests);

  useEffect(() => {
    getCoinsTotal(season && year ? { season, year, includeGuests } : { includeGuests }).catch(
      notifyFailure,
    );
  }, [season, year, includeGuests, getCoinsTotal]);

  useEffect(() => clearCoinsTotal, [clearCoinsTotal]);

  const handleToggle = (value: boolean) => {
    setIncludeGuests(value);
    saveIncludeGuests(value);
  };

  const answered = coinsTotal?.params;
  const label =
    answered?.season && answered.year
      ? `Крихт за ${convertSeasonEngToUkr(answered.season)} ${answered.year}`
      : 'Усього крихт';

  return (
    <div className={styles.summary}>
      <div className={styles.total}>
        <span className={`${styles.value} ${isLoading ? styles.loading : ''}`}>
          {coinsTotal ? formatCoins(coinsTotal.total) : '—'}
        </span>
        <span className={styles.label}>{label}</span>
        {coinsTotal && coinsTotal.unmarkedCount > 0 && (
          <span className={styles.hint}>
            Нікнеймів без типу: {coinsTotal.unmarkedCount}, їх враховано як команду
          </span>
        )}
      </div>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={includeGuests}
            onChange={(event) => handleToggle(event.target.checked)}
          />
        }
        label="Враховувати гостей"
      />
    </div>
  );
};
