import { FC, useState } from 'react';
import toast from 'react-hot-toast';

import { Box, Button, DialogProps, TextField } from '@mui/material';

import { useAnimesStore, useMembersStore } from '@/stores';
import { H6, CustomDialog } from '@/components';

export interface IDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

export const CreateAnimeAndMemberDialog: FC<IDialogProps> = ({ open, onClose }) => {
  const addAnime = useAnimesStore((state) => state.addAnime);
  const addMember = useMembersStore((state) => state.addMember);

  const handleSubmitTitle = async (name: string) => {
    try {
      await addAnime(name);

      toast.success('Аніме успішно додано!');
    } catch (e) {}
  };

  const handleSubmitUser = async (name: string) => {
    try {
      await addMember({ nickname: name, types: [], coins: 0, seasons: [] });

      toast.success('Новий учасник успішно створений!');
    } catch (e) {}
  };

  return (
    <CustomDialog onClose={onClose} open={open}>
      <DialogSection sectionTitle="Додати учасника" handleSubmit={handleSubmitUser} />

      <DialogSection sectionTitle="Додати аніме" handleSubmit={handleSubmitTitle} />
    </CustomDialog>
  );
};

interface DialogSectionProps {
  sectionTitle: string;
  handleSubmit: (name: string) => void;
}

const DialogSection = ({ sectionTitle, handleSubmit }: DialogSectionProps) => {
  const [name, setName] = useState('');

  return (
    <>
      <H6>{sectionTitle}</H6>

      <Box display="flex" gap={2} width="100%">
        <TextField
          placeholder="Введіть назву"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ width: '100%' }}
        />
        <Button
          variant="contained"
          disabled={!name}
          onClick={() => {
            handleSubmit(name);
            setName('');
          }}
        >
          Додати
        </Button>
      </Box>
    </>
  );
};
