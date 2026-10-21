import { FC } from 'react';
import clsx from 'clsx';

import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import { Button, IconButton } from '@mui/material';

import { Icon } from '@/components';
import type { Participant, Proposal } from '@/stores/useProposalsStore';
import MalImg from '/mal.png';
import { ParticipantsByRole } from './ParticipantsByRole';
import { ProposalChips } from './ProposalChips';
import styles from './ProposalCard.module.scss';

interface ProposalCardProps {
  proposal: Proposal;
  isSeasonClosed: boolean;
  username?: string;
  joinedCount: number;
  maxPerPerson: number;
  isAdmin: boolean;
  onJoin: (proposal: Proposal) => void;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposal: Proposal) => void;
  onEditParticipant: (proposal: Proposal, participant: Participant) => void;
}

const linkLabel = (link: string) => {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '');

    return host.includes('myanimelist') ? 'MAL' : host;
  } catch {
    return 'Посилання';
  }
};

export const ProposalCard: FC<ProposalCardProps> = ({
  proposal,
  isSeasonClosed,
  username,
  joinedCount,
  maxPerPerson,
  isAdmin,
  onJoin,
  onEdit,
  onDelete,
  onEditParticipant,
}) => {
  const { ukrName, romajiName, link, posterUrl, note, participants } = proposal;

  const hasJoined = participants.some((participant) => participant.userName === username);
  const isFull = !hasJoined && joinedCount >= maxPerPerson;
  const label = ((): string => {
    if (isSeasonClosed) return 'Сезон закрито';
    if (hasJoined) return 'Оновити лапу';
    if (isFull) return `Ліміт: ${joinedCount} з ${maxPerPerson}`;

    return 'Долучитися';
  })();

  return (
    <article className={clsx(styles.card, isSeasonClosed && styles.inactive)}>
      {posterUrl && <img className={styles.poster} src={posterUrl} alt={ukrName} />}

      <div className={styles.titles}>
        <span className={styles.ukr}>{ukrName}</span>
        <span className={styles.romaji}>{romajiName}</span>
      </div>

      <ProposalChips
        isOngoing={proposal.isOngoing}
        isSequel={proposal.isSequel}
        funding={proposal.funding}
      />

      <a className={styles.link} href={link} target="_blank" rel="noreferrer">
        {linkLabel(link) === 'MAL' ? (
          <Icon img={MalImg} width={20} height={20} />
        ) : (
          <OpenInNewIcon fontSize="small" />
        )}
        {linkLabel(link)}
      </a>

      {note && <p className={styles.note}>{note}</p>}

      <ParticipantsByRole
        participants={participants}
        currentUser={username}
        onParticipantClick={
          isAdmin ? (participant) => onEditParticipant(proposal, participant) : undefined
        }
      />

      <div className={styles.footer}>
        <Button
          variant={hasJoined ? 'outlined' : 'contained'}
          disabled={isSeasonClosed || isFull}
          onClick={() => onJoin(proposal)}
        >
          {label}
        </Button>

        <span className={styles.footerSpacer} />

        {isAdmin && (
          <>
            <IconButton aria-label="Редагувати" onClick={() => onEdit(proposal)}>
              <EditIcon />
            </IconButton>
            <IconButton aria-label="Видалити" onClick={() => onDelete(proposal)}>
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </div>
    </article>
  );
};
