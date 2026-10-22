import { FC, KeyboardEvent } from 'react';

import styles from './cards.module.scss';

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}

export const StatCard: FC<StatCardProps> = ({ title, value, hint, onClick }) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      {...(onClick && {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
      })}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
};
