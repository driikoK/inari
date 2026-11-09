import { FunctionComponent } from 'react';
import {
  FolderSpecialOutlined,
  PaymentsOutlined,
  Person2Outlined,
  SavingsOutlined,
} from '@mui/icons-material';

import { categoryLabel, formatKop, sourceLabel } from '@/pages/Budget/const/options';
import { SeasonStats } from '@/pages/Projects/components/SeasonStats';
import { seasonLabel } from '@/pages/Proposals/const/options';
import type { BudgetSeasonSummary } from '@/stores/useBudgetStore';
import type { ProjectSeason } from '@/stores/useProjectsStore';
import { MemberType } from '@/types';
import { plural } from '@/utils/plural';
import styles from '../Home.module.scss';
import { LeaderBoard } from './LeaderBoard';
import { StatCard } from './StatCard';
import { TopLine, TopList } from './TopList';

const LEADERS_TO_SHOW = 3;
const TOP_LIMIT = 5;

const topLines = <T extends { kop: number }>(
  items: T[],
  keyOf: (item: T) => string,
  labelOf: (item: T) => string,
): TopLine[] => {
  const biggest = [...items].sort((a, b) => b.kop - a.kop).slice(0, TOP_LIMIT);
  const max = Math.max(...biggest.map(({ kop }) => kop), 1);

  return biggest.map((item) => ({
    key: keyOf(item),
    label: labelOf(item),
    value: formatKop(item.kop),
    share: item.kop / max,
  }));
};

interface StatsGridProps {
  // Ordered by crumbs, the most first
  members: MemberType[];
  budget?: BudgetSeasonSummary;
  projects?: ProjectSeason;
  showUnmarked: boolean;
}

export const StatsGrid: FunctionComponent<StatsGridProps> = ({
  members,
  budget,
  projects,
  showUnmarked,
}) => {
  const team = members.filter(({ kind }) => kind === 'team').length;
  const guests = members.filter(({ kind }) => kind === 'guest').length;
  const unmarked = members.filter(({ kind }) => !kind).length;

  const guestsText = `${guests} ${plural(guests, ['гість', 'гості', 'гостей'])}`;
  const membersSub =
    showUnmarked && unmarked > 0 ? `${guestsText} · не позначено: ${unmarked}` : guestsText;

  return (
    <>
      <div className={styles.statsGrid}>
        <StatCard
          label="Учасники"
          value={`${team} ${plural(team, ['лис', 'лиси', 'лисів'])}`}
          sub={membersSub}
          color="var(--accent)"
          icon={<Person2Outlined />}
          delay={0.05}
        />

        {budget && (
          <>
            <StatCard
              label="Сезонна банка печива"
              value={formatKop(budget.jarKop)}
              sub={`${seasonLabel(budget.season, budget.year)} · надходжень: ${formatKop(budget.incomeKop)}`}
              color="var(--teal)"
              icon={<SavingsOutlined />}
              delay={0.1}
            />
            <StatCard
              label="Видано печива"
              value={formatKop(budget.expenses.reduce((sum, { kop }) => sum + kop, 0))}
              sub={seasonLabel(budget.season, budget.year)}
              color="var(--yellow)"
              icon={<PaymentsOutlined />}
              delay={0.15}
            />
          </>
        )}

        {projects && (
          <div className={`fade-up ${styles.statCard} ${styles.projectsCard}`}>
            <div className={styles.statCardHeader}>
              <div>
                <div className={styles.statCardLabel}>Проєкти</div>
                <div className={styles.statCardSub}>
                  {seasonLabel(projects.season, projects.year)}
                </div>
              </div>
              <div className={styles.statCardIcon} style={{ color: 'var(--green)' }}>
                <FolderSpecialOutlined />
              </div>
            </div>
            <SeasonStats stats={projects.stats} />
          </div>
        )}
      </div>

      <div className={styles.panelsGrid}>
        {members.length >= LEADERS_TO_SHOW && <LeaderBoard sortedMembers={members} />}

        {budget && (
          <>
            <TopList
              title="Топ надходжень"
              lines={topLines(
                budget.sources,
                ({ source }) => source,
                ({ source }) => sourceLabel(source),
              )}
              color="var(--teal)"
              delay={0.2}
            />
            <TopList
              title="Топ видатків"
              lines={topLines(
                budget.expenses,
                ({ category }) => category,
                ({ category }) => categoryLabel(category),
              )}
              color="var(--yellow)"
              delay={0.25}
            />
          </>
        )}
      </div>
    </>
  );
};
