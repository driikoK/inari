import { FC, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@mui/material';

import { CustomDialog, H6, P } from '@/components';
import useProposalsStore, {
  notifyFailure,
  type Participant,
  type Proposal,
  type ProposalRole,
} from '@/stores/useProposalsStore';
import { RoleCheckboxes } from './RoleCheckboxes';

interface ParticipantRolesDialogProps {
  open: boolean;
  onClose: () => void;
  proposal: Proposal;
  participant: Participant;
}

export const ParticipantRolesDialog: FC<ParticipantRolesDialogProps> = ({
  open,
  onClose,
  proposal,
  participant,
}) => {
  const setParticipantRoles = useProposalsStore((state) => state.setParticipantRoles);
  const [roles, setRoles] = useState<ProposalRole[]>(participant.roles);
  const [isSaving, setIsSaving] = useState(false);

  const isRemoving = roles.length === 0;

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await setParticipantRoles(proposal._id, participant.userName, roles);
      toast.success(isRemoving ? 'Учасника прибрано' : 'Ролі оновлено');
      onClose();
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomDialog open={open} onClose={onClose}>
      <H6>{participant.userName}</H6>
      <P sx={{ color: 'var(--text-muted)' }}>{proposal.ukrName}</P>

      <RoleCheckboxes value={roles} onChange={setRoles} />

      <Button
        variant="contained"
        color={isRemoving ? 'error' : 'primary'}
        disabled={isSaving}
        onClick={handleSubmit}
        fullWidth
      >
        {isRemoving ? 'Прибрати учасника' : 'Зберегти'}
      </Button>
    </CustomDialog>
  );
};
