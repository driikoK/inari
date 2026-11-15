import { FC } from 'react';

import styles from './Breakdown.module.scss';

export interface BreakdownRow {
  key: string;
  cells: string[];
}

interface BreakdownTableProps {
  head: string[];
  rows: BreakdownRow[];
  total?: string[];
  empty: string;
}

export const BreakdownTable: FC<BreakdownTableProps> = ({ head, rows, total, empty }) => {
  if (rows.length === 0) return <div className={styles.empty}>{empty}</div>;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {head.map((title) => (
            <th key={title}>{title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, cells }) => (
          <tr key={key}>
            {cells.map((cell, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a cell has no identity apart from its column
              <td key={index}>{cell}</td>
            ))}
          </tr>
        ))}
        {total && (
          <tr className={styles.total}>
            {total.map((cell, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a cell has no identity apart from its column
              <td key={index}>{cell}</td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
};
