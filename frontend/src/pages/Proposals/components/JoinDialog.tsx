import { FC, useState } from 'react';
import toast from 'react-hot-toast';

import { Button, TextField } from '@mui/material';

import { CustomDialog, H6, P } from '@/components';
import useProposalsStore, { type Proposal } from '@/stores/useProposalsStore';
import { notifyFailure } from '@/utils/request';
import { RoleCheckboxes } from './RoleCheckboxes';

interface JoinDialogProps {
  open: boolean;
  onClose: () => void;
  proposal: Proposal;
  username: string;
  joinedCount: number;
  maxPerPerson: number;
}

export const JoinDialog: FC<JoinDialogProps> = ({
  open,
  onClose,
  proposal,
  username,
  joinedCount,
  maxPerPerson,
}) => {
  const join = useProposalsStore((state) => state.join);

  const current = proposal.participants.find((participant) => participant.userName === username);
  const [roles, setRoles] = useState<string[]>(current?.roles ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const isWithdrawing = !!current && roles.length === 0;
  const buttonLabel = !current ? 'Докласти лапу' : isWithdrawing ? 'Забрати лапу' : 'Оновити лапу';

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await join(proposal._id, roles);
      toast.success(!current ? 'Лапу докладено' : isWithdrawing ? 'Лапу забрано' : 'Лапу оновлено');
      onClose();
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomDialog open={open} onClose={onClose}>
      <H6>{proposal.ukrName}</H6>

      <TextField label="Ім’я" value={username} disabled fullWidth />

      <RoleCheckboxes value={roles} onChange={setRoles} />

      <P sx={{ color: 'var(--text-muted)' }}>
        Ваша квота в сезоні: {joinedCount} з {maxPerPerson}
      </P>

      <Button
        variant="contained"
        color={isWithdrawing ? 'error' : 'primary'}
        disabled={isSaving || (!current && roles.length === 0)}
        onClick={handleSubmit}
        fullWidth
      >
        {buttonLabel}
      </Button>
    </CustomDialog>
  );
};
