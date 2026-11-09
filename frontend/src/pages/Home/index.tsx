import { FunctionComponent, useEffect, useMemo } from 'react';

import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import { useAuthStore, useBudgetStore, useMembersStore } from '@/stores';
import useProjectsStore from '@/stores/useProjectsStore';
import { notifyFailure } from '@/utils/request';
import styles from './Home.module.scss';
import { AboutBlock, MainCard, SectionLinks, StatsGrid } from './components';

const Home: FunctionComponent = () => {
  const { isLoggedIn } = useAuthStore();
  const { hasAccess } = usePermissions();
  const { members, getMembers } = useMembersStore();
  const { summary, getSummary } = useBudgetStore();
  const { seasons, getProjects } = useProjectsStore();

  useEffect(() => {
    if (isLoggedIn) {
      getMembers().catch(notifyFailure);
      getSummary().catch(notifyFailure);
      getProjects().catch(notifyFailure);
    }
  }, [isLoggedIn, getMembers, getSummary, getProjects]);

  const sortedMembers = useMemo(() => [...members].sort((a, b) => b.coins - a.coins), [members]);

  return (
    <div className={styles.page}>
      <MainCard isLoggedIn={isLoggedIn} />

      {isLoggedIn && (
        <>
          <AboutBlock />
          <SectionLinks />
          <StatsGrid
            members={sortedMembers}
            budget={summary?.seasons.find(({ isCurrent }) => isCurrent)}
            projects={seasons.find(({ isCurrent }) => isCurrent)}
            showUnmarked={hasAccess(SUBJECTS.EDIT_MEMBER_KIND)}
          />
        </>
      )}
    </div>
  );
};

export default Home;
