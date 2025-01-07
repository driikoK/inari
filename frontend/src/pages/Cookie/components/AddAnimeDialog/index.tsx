import { FC, useState } from 'react';
import { Box, TextField, type DialogProps, Button } from '@mui/material';
import toast from 'react-hot-toast';
import { CustomDialog, H6 } from '@/components';
import { useAnimeStore } from '@/stores';

export interface IAddAnimeDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const AddAnimeDialog: FC<IAddAnimeDialogProps> = ({ open, onClose }) => {
  const [anime, setAnime] = useState<string>('');
  const { addAnime } = useAnimeStore();

  const handleSubmit = async () => {
    try {
      await addAnime(anime);

      setAnime('');

      toast.success('Аніме додано успішно!');
    } catch (e) {}
  };

  return (
    <CustomDialog onClose={onClose} open={open}>
      <H6>Додавання аніме</H6>

      <Box display="flex" gap={2} width="100%">
        <TextField
          placeholder="Введіть назву аніме"
          value={anime}
          onChange={(e) => setAnime(e.target.value)}
          sx={{ width: '100%' }}
        />

        <Button variant="contained" disabled={anime.length < 3} onClick={handleSubmit}>
          Зберегти
        </Button>
      </Box>
    </CustomDialog>
  );
};

export default AddAnimeDialog;
