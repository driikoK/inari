import { FC, useState } from 'react';

import { Button } from '@mui/material';

import { seasonLabel } from '@/pages/Proposals/const/options';
import type { BudgetSeasonSummary } from '@/stores/useBudgetStore';
import { formatCoins } from '@/utils/convert';
import { formatCoefficient, formatKop } from '../const/options';
import styles from './cards.module.scss';

interface EarlierSeasonsProps {
  seasons: BudgetSeasonSummary[];
  onOpen: (season: BudgetSeasonSummary) => void;
}

export const EarlierSeasons: FC<EarlierSeasonsProps> = ({ seasons, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (seasons.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>Банки попередніх сезонів</div>
        <Button size="small" onClick={() => setIsOpen((open) => !open)}>
          {isOpen ? 'Сховати' : `Показати (${seasons.length})`}
        </Button>
      </div>

      {isOpen && (
        <table className={styles.seasonsTable}>
          <thead>
            <tr>
              <th>Сезон</th>
              <th>Надходження</th>
              <th>Банка</th>
              <th>Крихти</th>
              <th>Коефіцієнт виводу</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr
                key={`${season.season}-${season.year}`}
                tabIndex={0}
                onClick={() => onOpen(season)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(season);
                  }
                }}
              >
                <td>{seasonLabel(season.season, season.year)}</td>
                <td>{formatKop(season.incomeKop)}</td>
                <td>{formatKop(season.jarKop)}</td>
                <td>{formatCoins(season.crumbs)}</td>
                <td>{formatCoefficient(season.coefficient)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
