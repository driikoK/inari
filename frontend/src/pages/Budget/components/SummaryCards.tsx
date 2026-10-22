import { FC, useState } from 'react';

import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import type { BudgetSeasonSummary, BudgetSummary } from '@/stores/useBudgetStore';
import { formatKop } from '../const/options';
import { BreakdownDialog, type BreakdownKind } from './BreakdownDialog';
import { SeasonJarCard } from './SeasonJarCard';
import { StatCard } from './StatCard';
import { SupportBudgetDialog } from './SupportBudgetDialog';
import { TopExpensesCard } from './TopExpensesCard';
import styles from './cards.module.scss';

interface SummaryCardsProps {
  summary: BudgetSummary;
}

interface Opened {
  kind: BreakdownKind;
  season?: BudgetSeasonSummary;
}

export const SummaryCards: FC<SummaryCardsProps> = ({ summary }) => {
  const { hasAccess } = usePermissions();
  const [opened, setOpened] = useState<Opened | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const seasons = [...summary.seasons].sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  const current = summary.seasons.find(({ isCurrent }) => isCurrent);

  return (
    <>
      <div className={styles.jarGrid}>
        {seasons.map((season) => (
          <SeasonJarCard
            key={`${season.season}-${season.year}`}
            summary={season}
            onClick={() => setOpened({ kind: 'jar', season })}
          />
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
          onClick={() => setOpened({ kind: 'orders' })}
        />
        <StatCard
          title="Печивко підтримки"
          value={formatKop(summary.supportKop)}
          hint="Бюджети напрямків підтримки"
          onClick={() => setOpened({ kind: 'support' })}
        />
        <StatCard
          title="Смаколики"
          value={formatKop(summary.treatsKop)}
          hint={`З банок проєктів. Цього сезону: ${formatKop(current?.treatsKop ?? 0)}`}
          onClick={() => setOpened({ kind: 'treats' })}
        />
        <StatCard
          title="Лисодари"
          value={formatKop(summary.lisodariKop)}
          hint={`Від учасників на розвиток. Цього сезону: ${formatKop(current?.lisodariKop ?? 0)}`}
          onClick={() => setOpened({ kind: 'lisodari' })}
        />
      </div>

      <TopExpensesCard summary={summary} />

      {opened && (
        <BreakdownDialog
          kind={opened.kind}
          summary={summary}
          season={
            opened.season &&
            summary.seasons.find(
              ({ season, year }) =>
                season === opened.season?.season && year === opened.season?.year,
            )
          }
          canManage={hasAccess(SUBJECTS.MANAGE_BUDGET)}
          onClose={() => setOpened(null)}
          onManageSupport={() => setIsSupportOpen(true)}
        />
      )}

      {isSupportOpen && (
        <SupportBudgetDialog summary={summary} onClose={() => setIsSupportOpen(false)} />
      )}
    </>
  );
};
