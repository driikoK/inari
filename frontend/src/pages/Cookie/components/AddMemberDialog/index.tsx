import { FC } from 'react';
import toast from 'react-hot-toast';

import { DialogProps } from '@mui/material';

import { useMembersStore } from '@/stores';
import { CustomDialog } from '@/components';
import { MemberKind } from '@/types';
import { AddMemberSection } from './AddMemberSection';

export interface IDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

export const AddMemberDialog: FC<IDialogProps> = ({ open, onClose }) => {
  const addMember = useMembersStore((state) => state.addMember);

  const handleSubmitMember = async (name: string, kind: MemberKind) => {
    try {
      await addMember({ nickname: name, kind, types: [], coins: 0, seasons: [] });

      toast.success('Новий учасник успішно створений!');
    } catch (e) {}
  };

  return (
    <CustomDialog onClose={onClose} open={open}>
      <AddMemberSection onSubmit={handleSubmitMember} />
    </CustomDialog>
  );
};
