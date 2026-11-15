import { FunctionComponent } from 'react';
import styles from '../Home.module.scss';

export interface TopLine {
  key: string;
  label: string;
  value: string;
  share: number;
}

interface TopListProps {
  title: string;
  lines: TopLine[];
  color: string;
  delay?: number;
}

export const TopList: FunctionComponent<TopListProps> = ({ title, lines, color, delay = 0 }) => (
  <div className={`fade-up ${styles.panel}`} style={{ animationDelay: `${delay}s` }}>
    <div className={styles.panelTitle}>{title}</div>

    {lines.length === 0 ? (
      <div className={styles.panelHint}>Цього сезону ще нічого не було</div>
    ) : (
      lines.map(({ key, label, value, share }) => (
        <div key={key} className={styles.topLine}>
          <div className={styles.topLineHead}>
            <span>{label}</span>
            <span className={styles.topLineValue}>{value}</span>
          </div>
          <div
            className={styles.topLineBar}
            style={{ width: `${share * 100}%`, background: color }}
          />
        </div>
      ))
    )}
  </div>
);
