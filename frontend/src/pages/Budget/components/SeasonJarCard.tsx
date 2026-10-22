import { FC } from 'react';

import { seasonLabel } from '@/pages/Proposals/const/options';
import type { BudgetSeasonSummary } from '@/stores/useBudgetStore';
import { formatCoins } from '@/utils/convert';
import { formatCoefficient, formatKop, formatSignedKop } from '../const/options';
import styles from './cards.module.scss';

interface SeasonJarCardProps {
  summary: BudgetSeasonSummary;
}

export const SeasonJarCard: FC<SeasonJarCardProps> = ({ summary }) => {
  const { season, year, isCurrent } = summary;

  return (
    <div className={`${styles.card} ${isCurrent ? styles.cardCurrent : ''}`}>
      <div className={styles.head}>
        <div className={styles.title}>Сезонна банка печива</div>
        <span className={`${styles.tag} ${isCurrent ? styles.tagCurrent : ''}`}>
          {isCurrent ? 'Поточний' : 'Минулий'}
        </span>
      </div>

      <div className={styles.season}>{seasonLabel(season, year)}</div>
      <div className={styles.value}>{formatKop(summary.jarKop)}</div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span>Надходження</span>
          <span>{formatKop(summary.incomeKop)}</span>
        </div>
        <div className={styles.row}>
          <span>Печивко підтримки</span>
          <span>{formatSignedKop(-summary.supportKop)}</span>
        </div>
        <div className={styles.row}>
          <span>Тістечка замовлень</span>
          <span>{formatSignedKop(-summary.ordersKop)}</span>
        </div>
        <div className={styles.row}>
          <span>Виплати за крихти</span>
          <span>{formatSignedKop(-summary.payoutsKop)}</span>
        </div>
        <div className={styles.row}>
          <span>Крихти команди за сезон</span>
          <span>{formatCoins(summary.crumbs)}</span>
        </div>
      </div>

      <div className={styles.coefficient} title="(надходження − підтримка − замовлення) ÷ крихти">
        Коефіцієнт виводу: {formatCoefficient(summary.coefficient)}
      </div>
    </div>
  );
};
