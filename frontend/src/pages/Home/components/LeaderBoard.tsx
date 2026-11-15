import { MemberType } from '@/types';
import { crumbsWord } from '@/utils/plural';
import styles from '../Home.module.scss';
import { FunctionComponent } from 'react';

export const LeaderBoard: FunctionComponent<{ sortedMembers: MemberType[] }> = ({
  sortedMembers,
}) => {
  const podiumColors = [
    'var(--accent)',
    'var(--orange-light)',
    'var(--teal)',
    'var(--yellow)',
    'var(--green)',
    'var(--red)',
    'var(--orange)',
    'var(--violet)',
    'var(--text)',
    'var(--text-muted)',
  ];

  return (
    <div className={`fade-up fade-up-2 ${styles.leaderboard}`}>
      <div className={styles.leaderboardTitle}>Топ крихт 🏆</div>
      {sortedMembers.slice(0, 10).map((member, i) => (
        <div
          key={member._id}
          className={styles.leaderboardRow}
          style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}
        >
          <div
            className={styles.leaderboardRank}
            style={{
              color: podiumColors[i],
            }}
          >
            {i + 1}
          </div>
          <div className={styles.leaderboardName}>{member.nickname}</div>
          <div className={styles.leaderboardCoins} style={{ color: podiumColors[i] }}>
            {member.coins}
          </div>
          <div className={styles.leaderboardUnit}>{crumbsWord(member.coins)}</div>
        </div>
      ))}
    </div>
  );
};
