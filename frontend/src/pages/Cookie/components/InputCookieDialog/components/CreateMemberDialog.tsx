import { FunctionComponent, useState } from 'react';
import toast from 'react-hot-toast';

import { TextField, type DialogProps, Button } from '@mui/material';

import { CustomDialog, H6, MemberKindToggle } from '@/components';
import { useMembersStore } from '@/stores';
import { MemberKind } from '@/types';

export interface IRequiredAuthorizationDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const CreateMemberDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  onClose,
}) => {
  const [nickname, setNickname] = useState<string>('');
  const [kind, setKind] = useState<MemberKind | null>(null);
  const addMember = useMembersStore((state) => state.addMember);

  const handleSubmit = async () => {
    if (!kind) return;

    try {
      await addMember({ nickname, kind, types: [], coins: 0, seasons: [] });

      toast.success('Новий мембер створений успішно!');
    } catch (e) {}
  };

  return (
    <CustomDialog onClose={onClose} open={open}>
      <H6>Створення користувача</H6>
      <TextField
        placeholder="Введіть нікнейм"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        sx={{ width: '100%' }}
      />
      <MemberKindToggle value={kind} onChange={setKind} />
      <Button
        type="submit"
        color="inherit"
        disabled={nickname.length < 3 || !kind}
        onClick={handleSubmit}
      >
        Зберегти
      </Button>
    </CustomDialog>
  );
};

export default CreateMemberDialog;
