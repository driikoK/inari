import { FC, useState } from 'react';
import toast from 'react-hot-toast';

import { Button, DialogProps, IconButton, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';

import { DialogWrapper, Title } from './styles';
import { DialogContainer } from '../InfoDialog/styles';
import useAnimeStore from '@/stores/useAnimeStore';
import useUsersStore from '@/stores/useUsersStore';

export interface IDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

export const CreateAnimeAndUserDialog: FC<IDialogProps> = ({ open, onClose }) => {
  const [nickname, setNickname] = useState<string>('');
  const [titleName, setTitleName] = useState<string>('');

  const { addAnime } = useAnimeStore();
  const { addUser } = useUsersStore();

  const handleSubmitTitle = async () => {
    try {
      await addAnime(titleName);

      toast.success('Аніме додано успішно!');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      toast.error('Помилка!');
    }
  };

  const handleSubmitUser = async () => {
    try {
      await addUser({ nickname, types: [], coins: 0, seasons: [] });

      toast.success('Новий учасник створений успішно!');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      toast.error('Помилка!');
    }
  };

  return (
    <DialogContainer open={open} onClose={onClose}>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={() => ({
          position: 'absolute',
          right: 8,
          top: 8,
        })}
      >
        <Close />
      </IconButton>
      <Title>Додати учасника</Title>

      <DialogWrapper>
        <TextField
          placeholder="Введіть нікнейм"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Button variant="contained" disabled={!nickname} onClick={handleSubmitUser}>
          Додати
        </Button>
      </DialogWrapper>

      <Title>Додати аніме</Title>

      <DialogWrapper>
        <TextField
          placeholder="Введіть назву"
          value={titleName}
          onChange={(e) => setTitleName(e.target.value)}
        />
        <Button variant="contained" disabled={!titleName} onClick={handleSubmitTitle}>
          Додати
        </Button>
      </DialogWrapper>
    </DialogContainer>
  );
};
