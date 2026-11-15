import { FC, useEffect, useState } from 'react';

import { useMembersStore } from '@/stores';
import { MyCoins } from '@/types';
import { convertSeasonEngToUkr, formatCoins } from '@/utils/convert';
import { notifyFailure } from '@/utils/request';
import styles from './styles.module.scss';

export const CoinsBalance: FC = () => {
  const getMyCoins = useMembersStore((state) => state.getMyCoins);
  const [myCoins, setMyCoins] = useState<MyCoins | null>(null);

  useEffect(() => {
    getMyCoins().then(setMyCoins).catch(notifyFailure);
  }, [getMyCoins]);

  if (!myCoins) return null;

  const { season, year, coins: seasonCoins } = myCoins.currentSeason;

  return (
    <>
      <hr className={styles.divider} />

      {myCoins.nickname ? (
        <section className={styles.balance}>
          <div className={styles.fieldLabel}>Нікнейм у команді</div>
          <div className={styles.nickname}>{myCoins.nickname}</div>

          <div className={styles.tiles}>
            <div className={styles.tile}>
              <span className={styles.value}>{formatCoins(myCoins.coins)}</span>
              <span className={styles.label}>Усього крихт</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.value}>{formatCoins(seasonCoins)}</span>
              <span className={styles.label}>
                {convertSeasonEngToUkr(season)} {year}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <p className={styles.hint}>
          Нікнейм у команді ще не призначено. Коли адмін прив’яже його до вашого акаунта, тут
          з’явиться баланс крихт.
        </p>
      )}
    </>
  );
};
