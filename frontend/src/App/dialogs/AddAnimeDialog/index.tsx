/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useState } from 'react';
import {
  Snackbar,
  TextField,
  type DialogProps,
} from '@mui/material';
import { DialogContainer, InputWrapper, Title, TitleWrapper } from './styles';
import Button from '@/components/Button';
import useAnimeStore from '@/stores/useAnimeStore';

export interface IAddAnimeDialogProps
  extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const AddAnimeDialog: FunctionComponent<
  IAddAnimeDialogProps
> = ({ open, onClose }) => {
  const [anime, setAnime] = useState<string>('');
  const [isPopOpen, setPopOpen] = useState<boolean>(false);
  const [popMessage, setPopMessage] = useState('');
  const { addAnime } = useAnimeStore();

  const handleAnimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAnime(value);
  };
  const handleSubmit = () => {
    try { 
      addAnime(anime);

      setPopMessage('Успішно');
      setPopOpen(true);
      setTimeout(() => {
        onClose();
      }, 1000)
    } catch (e) {
      setPopMessage('Помилка');
      setPopOpen(true);
    }
  };

  return (
    <DialogContainer open={open} onClose={onClose}>
      <TitleWrapper>
        <Title>Додавання аніме</Title>
      </TitleWrapper>
      <InputWrapper>
        <TextField
          placeholder="Введіть назву аніме"
          value={anime}
          onChange={handleAnimeChange}
        />
      </InputWrapper>
      <Button
        variant="contained"
        disabled={anime.length < 3}
        onClick={handleSubmit}
      >
        Зберегти
      </Button>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={isPopOpen}
        autoHideDuration={1000}
        onClose={() => setPopOpen(false)}
        message={popMessage}
      />
    </DialogContainer>
  );
};

export default AddAnimeDialog;
