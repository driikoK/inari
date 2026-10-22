import { FC } from 'react';

import styles from './cards.module.scss';

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
}

export const StatCard: FC<StatCardProps> = ({ title, value, hint }) => (
  <div className={styles.card}>
    <div className={styles.title}>{title}</div>
    <div className={styles.value}>{value}</div>
    {hint && <div className={styles.hint}>{hint}</div>}
  </div>
);
