import { FC, useState } from 'react';
import toast from 'react-hot-toast';

import { Button, DialogProps, IconButton, TextField } from '@mui/material';
import Close from '@mui/icons-material/Close';

import { DialogContainer, DialogWrapper } from './styles';
import useAnimeStore from '@/stores/useAnimeStore';
import useMembersStore from '@/stores/useMembersStore';
import { H6 } from '@/components';

export interface IDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

export const CreateAnimeAndMemberDialog: FC<IDialogProps> = ({ open, onClose }) => {
  const [nickname, setNickname] = useState<string>('');
  const [titleName, setTitleName] = useState<string>('');

  const { addAnime } = useAnimeStore();
  const { addMember } = useMembersStore();

  const handleSubmitTitle = async () => {
    try {
      await addAnime(titleName);

      toast.success('Аніме успішно додано!');
    } catch (e) {}
  };

  const handleSubmitUser = async () => {
    try {
      await addMember({ nickname, types: [], coins: 0, seasons: [] });

      toast.success('Новий учасник успішно створений!');
    } catch (e) {}
  };

  return (
    <DialogContainer open={open} onClose={onClose} fullWidth>
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

      <H6>Додати учасника</H6>

      <DialogWrapper>
        <TextField
          placeholder="Введіть нікнейм"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          sx={{ width: '100%' }}
        />
        <Button variant="contained" disabled={!nickname} onClick={handleSubmitUser}>
          Додати
        </Button>
      </DialogWrapper>

      <H6>Додати аніме</H6>

      <DialogWrapper>
        <TextField
          placeholder="Введіть назву"
          value={titleName}
          onChange={(e) => setTitleName(e.target.value)}
          sx={{ width: '100%' }}
        />
        <Button variant="contained" disabled={!titleName} onClick={handleSubmitTitle}>
          Додати
        </Button>
      </DialogWrapper>
    </DialogContainer>
  );
};
