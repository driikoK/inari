import { FC } from 'react';

import type { SeasonStats as SeasonStatsData } from '@/stores/useProjectsStore';
import styles from './SeasonStats.module.scss';

interface SeasonStatsProps {
  stats: SeasonStatsData;
}

export const SeasonStats: FC<SeasonStatsProps> = ({ stats }) => {
  const items = [
    { label: 'Усього', value: stats.total },
    { label: 'Онґоїнґи', value: stats.ongoing },
    { label: 'Стареча', value: stats.old },
    { label: 'Борги', value: stats.debt },
    { label: 'Меценатські', value: stats.patron },
    { label: 'Замовлення', value: stats.order },
  ];

  return (
    <div className={styles.stats}>
      {items.map(({ label, value }) => (
        <div className={styles.stat} key={label}>
          <span className={styles.value}>{value}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
};
