import { FC } from 'react';
import clsx from 'clsx';

import type { Participant } from '@/stores/useProposalsStore';
import { proposalRoles } from '../const/options';
import styles from './ProposalCard.module.scss';

interface ParticipantsByRoleProps {
  participants: Participant[];
  currentUser?: string;
  onParticipantClick?: (participant: Participant) => void;
}

export const ParticipantsByRole: FC<ParticipantsByRoleProps> = ({
  participants,
  currentUser,
  onParticipantClick,
}) => (
  <div className={styles.roles}>
    {proposalRoles.map((role) => {
      const people = participants.filter((participant) => participant.roles.includes(role.value));

      return (
        <div className={styles.roleRow} key={role.value}>
          <span className={styles.roleLabel}>{role.label}</span>

          <span className={styles.names}>
            {people.length === 0 && <span className={styles.empty}>—</span>}

            {people.map((participant) => {
              const className = clsx(
                styles.name,
                participant.userName === currentUser && styles.me,
              );

              return onParticipantClick ? (
                <button
                  type="button"
                  key={participant.userName}
                  className={clsx(className, styles.nameButton)}
                  onClick={() => onParticipantClick(participant)}
                >
                  {participant.userName}
                </button>
              ) : (
                <span key={participant.userName} className={className}>
                  {participant.userName}
                </span>
              );
            })}
          </span>
        </div>
      );
    })}
  </div>
);
