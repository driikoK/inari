import { FC, useState } from 'react';

import { MenuItem, TextField } from '@mui/material';

import { seasonLabel } from '@/pages/Proposals/const/options';
import type { BudgetSummary } from '@/stores/useBudgetStore';
import { categoryLabel, formatKop, seasonKey } from '../const/options';
import breakdown from './Breakdown.module.scss';
import styles from './cards.module.scss';

interface TopExpensesCardProps {
  summary: BudgetSummary;
}

export const TopExpensesCard: FC<TopExpensesCardProps> = ({ summary }) => {
  const current = summary.seasons.find(({ isCurrent }) => isCurrent) ?? summary.seasons[0];
  const [picked, setPicked] = useState(seasonKey(current.season, current.year));

  const season =
    summary.seasons.find((item) => seasonKey(item.season, item.year) === picked) ?? current;
  const biggest = Math.max(...season.expenses.map(({ kop }) => kop), 1);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>Топ видатків за сезон</div>
        <TextField
          select
          size="small"
          value={picked}
          onChange={(event) => setPicked(event.target.value)}
          sx={{ minWidth: 150 }}
        >
          {[...summary.seasons].reverse().map((item) => (
            <MenuItem
              key={seasonKey(item.season, item.year)}
              value={seasonKey(item.season, item.year)}
            >
              {seasonLabel(item.season, item.year)}
            </MenuItem>
          ))}
        </TextField>
      </div>

      {season.expenses.length === 0 ? (
        <div className={styles.hint}>Видатків за цей сезон ще не було</div>
      ) : (
        <div className={breakdown.expenses}>
          {season.expenses.map(({ category, kop }) => (
            <div key={category} className={breakdown.expense}>
              <div className={breakdown.expenseHead}>
                <span>{categoryLabel(category)}</span>
                <span>{formatKop(kop)}</span>
              </div>
              <div className={breakdown.bar} style={{ width: `${(kop / biggest) * 100}%` }} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.hint}>
        За сезоном дати виплати. Переказ на розвиток команди сюди не входить: гроші лишаються в
        команді.
      </div>
    </div>
  );
};
