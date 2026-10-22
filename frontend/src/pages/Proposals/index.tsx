import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Button, CircularProgress, Tab, Tabs } from '@mui/material';

import { ConfirmDeleteDialog } from '@/components';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import { useAuthStore } from '@/stores';
import useRolesStore from '@/stores/useRolesStore';
import useProposalsStore, {
  type Participant,
  type Proposal,
  type ProposalSeason,
} from '@/stores/useProposalsStore';
import { notifyFailure } from '@/utils/request';
import { seasonLabel } from './const/options';
import { JoinDialog } from './components/JoinDialog';
import { ProjectFormDialog } from '@/pages/Projects/components/ProjectFormDialog';
import { ParticipantRolesDialog } from './components/ParticipantRolesDialog';
import { ProposalCard } from './components/ProposalCard';
import { ProposalFormDialog } from './components/ProposalFormDialog';
import { SeasonFormDialog } from './components/SeasonFormDialog';
import { SeasonToolbar } from './components/SeasonToolbar';
import styles from './Proposals.module.scss';

const keyOf = (season: ProposalSeason) => `${season.season}-${season.year}`;

const Proposals: FC = () => {
  const {
    seasons,
    maxPerPerson,
    isLoading,
    getProposals,
    setSeasonClosed,
    deleteSeason,
    deleteProposal,
  } = useProposalsStore();
  const getRoles = useRolesStore((state) => state.getRoles);
  const username = useAuthStore((state) => state.user?.username);
  const { hasAccess } = usePermissions();
  const isAdmin = hasAccess(SUBJECTS.MANAGE_PROPOSALS);
  const canLaunch = hasAccess(SUBJECTS.MANAGE_PROJECTS);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isSeasonFormOpen, setIsSeasonFormOpen] = useState(false);
  const [isProposalFormOpen, setIsProposalFormOpen] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState<Proposal | null>(null);
  const [proposalToJoin, setProposalToJoin] = useState<Proposal | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [proposalToLaunch, setProposalToLaunch] = useState<Proposal | null>(null);
  const [isSeasonDeleteOpen, setIsSeasonDeleteOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState<{
    proposal: Proposal;
    participant: Participant;
  } | null>(null);

  useEffect(() => {
    getProposals().catch(notifyFailure);
    getRoles().catch(notifyFailure);
  }, [getProposals, getRoles]);

  const current =
    seasons.find((season) => keyOf(season) === selectedKey) ??
    seasons.find((season) => !season.isClosed) ??
    seasons[0];

  useEffect(() => {
    if (current && selectedKey !== keyOf(current)) setSelectedKey(keyOf(current));
  }, [current, selectedKey]);

  const joinedCount = current
    ? current.proposals.filter((proposal) =>
        proposal.participants.some((participant) => participant.userName === username),
      ).length
    : 0;

  const handleToggleClosed = async () => {
    if (!current) return;

    try {
      await setSeasonClosed(current._id, !current.isClosed);
      toast.success(current.isClosed ? 'Сезон відкрито' : 'Сезон закрито');
    } catch (error) {
      notifyFailure(error);
    }
  };

  const handleDeleteSeason = async () => {
    if (!current) return;

    try {
      await deleteSeason(current._id);
      setSelectedKey(null);
      toast.success('Сезон видалено');
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsSeasonDeleteOpen(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;

    try {
      await deleteProposal(proposalToDelete._id);
      toast.success('Пропозицію видалено');
    } catch (error) {
      notifyFailure(error);
    } finally {
      setProposalToDelete(null);
    }
  };

  const pawsInSeason = current
    ? current.proposals.reduce((total, proposal) => total + proposal.participants.length, 0)
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Пропозиції</div>
          <div className={styles.subtitle}>
            Тайтли на наступні сезони: долучайся з ролями, які готовий взяти
          </div>
        </div>

        {isAdmin && (
          <Button variant="contained" onClick={() => setIsSeasonFormOpen(true)}>
            Додати сезон
          </Button>
        )}
      </div>

      {isLoading && seasons.length === 0 && <CircularProgress sx={{ alignSelf: 'center' }} />}

      {!isLoading && seasons.length === 0 && (
        <div className={styles.empty}>
          {isAdmin
            ? 'Сезонів поки немає. Додайте перший, щоб збирати пропозиції.'
            : 'Сезонів поки немає.'}
        </div>
      )}

      {current && (
        <>
          <Tabs
            className={styles.tabs}
            value={keyOf(current)}
            onChange={(_, key: string) => setSelectedKey(key)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {seasons.map((season) => (
              <Tab
                key={keyOf(season)}
                value={keyOf(season)}
                label={seasonLabel(season.season, season.year)}
                icon={season.isClosed ? <LockOutlinedIcon fontSize="small" /> : undefined}
                iconPosition="end"
                sx={{ textTransform: 'none', minHeight: 48 }}
              />
            ))}
          </Tabs>

          <SeasonToolbar
            season={current}
            joinedCount={joinedCount}
            maxPerPerson={maxPerPerson}
            isAdmin={isAdmin}
            onAddProposal={() => setIsProposalFormOpen(true)}
            onToggleClosed={handleToggleClosed}
            onDelete={() => setIsSeasonDeleteOpen(true)}
          />

          {current.proposals.length === 0 ? (
            <div className={styles.empty}>У цьому сезоні поки немає пропозицій.</div>
          ) : (
            <div className={styles.grid}>
              {current.proposals.map((proposal) => (
                <ProposalCard
                  key={proposal._id}
                  proposal={proposal}
                  isSeasonClosed={current.isClosed}
                  username={username}
                  joinedCount={joinedCount}
                  maxPerPerson={maxPerPerson}
                  isAdmin={isAdmin}
                  canLaunch={canLaunch}
                  onJoin={setProposalToJoin}
                  onEdit={setProposalToEdit}
                  onDelete={setProposalToDelete}
                  onLaunch={setProposalToLaunch}
                  onEditParticipant={(target, participant) =>
                    setParticipantToEdit({ proposal: target, participant })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {isSeasonFormOpen && (
        <SeasonFormDialog
          open
          onClose={() => setIsSeasonFormOpen(false)}
          onCreated={setSelectedKey}
        />
      )}

      {current && isProposalFormOpen && (
        <ProposalFormDialog
          open
          onClose={() => setIsProposalFormOpen(false)}
          season={current}
          seasons={seasons}
        />
      )}

      {current && proposalToEdit && (
        <ProposalFormDialog
          open
          onClose={() => setProposalToEdit(null)}
          season={current}
          seasons={seasons}
          proposal={proposalToEdit}
        />
      )}

      {proposalToJoin && username && (
        <JoinDialog
          open
          onClose={() => setProposalToJoin(null)}
          proposal={proposalToJoin}
          username={username}
          joinedCount={joinedCount}
          maxPerPerson={maxPerPerson}
        />
      )}

      {proposalToLaunch && (
        <ProjectFormDialog
          open
          onClose={() => setProposalToLaunch(null)}
          proposal={proposalToLaunch}
        />
      )}

      {participantToEdit && (
        <ParticipantRolesDialog
          open
          onClose={() => setParticipantToEdit(null)}
          proposal={participantToEdit.proposal}
          participant={participantToEdit.participant}
        />
      )}

      <ConfirmDeleteDialog
        open={!!proposalToDelete}
        title="Видалити пропозицію?"
        message={`Пропозицію «${proposalToDelete?.ukrName}» буде видалено разом з лапами учасників (${proposalToDelete?.participants.length}). Цю дію не можна скасувати.`}
        onConfirm={handleDeleteProposal}
        onCancel={() => setProposalToDelete(null)}
      />

      <ConfirmDeleteDialog
        open={isSeasonDeleteOpen}
        title="Видалити сезон?"
        message={`Сезон «${current ? seasonLabel(current.season, current.year) : ''}» буде видалено разом з пропозиціями (${current?.proposals.length ?? 0}) та лапами учасників (${pawsInSeason}). Цю дію не можна скасувати.`}
        onConfirm={handleDeleteSeason}
        onCancel={() => setIsSeasonDeleteOpen(false)}
      />
    </div>
  );
};

export default Proposals;
