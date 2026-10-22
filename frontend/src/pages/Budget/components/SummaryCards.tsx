import { FC } from 'react';

import type { BudgetSummary } from '@/stores/useBudgetStore';
import { formatKop } from '../const/options';
import { SeasonJarCard } from './SeasonJarCard';
import { StatCard } from './StatCard';
import styles from './cards.module.scss';

interface SummaryCardsProps {
  summary: BudgetSummary;
}

export const SummaryCards: FC<SummaryCardsProps> = ({ summary }) => {
  const seasons = [...summary.seasons].sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  const current = summary.seasons.find(({ isCurrent }) => isCurrent);

  return (
    <>
      <div className={styles.jarGrid}>
        {seasons.map((season) => (
          <SeasonJarCard key={`${season.season}-${season.year}`} summary={season} />
        ))}
      </div>

      <div className={styles.grid}>
        <StatCard
          title="Кондитерська"
          value={formatKop(summary.confectioneryKop)}
          hint="Усі гроші команди зараз"
        />
        <StatCard
          title="Тістечка замовлень"
          value={formatKop(summary.ordersKop)}
          hint="Бюджети замовлених тайтлів"
        />
        <StatCard
          title="Печивко підтримки"
          value={formatKop(summary.supportKop)}
          hint="Бюджети напрямків підтримки"
        />
        <StatCard
          title="Смаколики"
          value={formatKop(summary.treatsKop)}
          hint={`З банок проєктів. Цього сезону: ${formatKop(current?.treatsKop ?? 0)}`}
        />
        <StatCard
          title="Лисодари"
          value={formatKop(summary.lisodariKop)}
          hint={`Від учасників на розвиток. Цього сезону: ${formatKop(current?.lisodariKop ?? 0)}`}
        />
      </div>
    </>
  );
};
