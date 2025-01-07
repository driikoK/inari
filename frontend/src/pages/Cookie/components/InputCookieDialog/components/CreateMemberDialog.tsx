import { FunctionComponent, useState } from 'react';
import toast from 'react-hot-toast';

import { TextField, type DialogProps, Button } from '@mui/material';

import { CustomDialog, H6 } from '@/components';
import { useMembersStore } from '@/stores';

export interface IRequiredAuthorizationDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const CreateMemberDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  onClose,
}) => {
  const [nickname, setNickname] = useState<string>('');
  const addMember = useMembersStore((state) => state.addMember);

  const handleSubmit = async () => {
    try {
      await addMember({ nickname, types: [], coins: 0, seasons: [] });

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
      <Button type="submit" color="inherit" disabled={nickname.length < 3} onClick={handleSubmit}>
        Зберегти
      </Button>
    </CustomDialog>
  );
};

export default CreateMemberDialog;
