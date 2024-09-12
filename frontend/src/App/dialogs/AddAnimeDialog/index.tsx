/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useState } from 'react';
import { TextField, type DialogProps } from '@mui/material';
import toast from 'react-hot-toast';
import { DialogContainer, InputWrapper, Title, TitleWrapper } from './styles';
import Button from '@/components/Button';
import useAnimeStore from '@/stores/useAnimeStore';

export interface IAddAnimeDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const AddAnimeDialog: FunctionComponent<IAddAnimeDialogProps> = ({ open, onClose }) => {
  const [anime, setAnime] = useState<string>('');
  const { addAnime } = useAnimeStore();

  const handleAnimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAnime(value);
  };
  const handleSubmit = async () => {
    try {
      await addAnime(anime);

      toast.success('Аніме додано успішно!');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      toast.error('Помилка!');
    }
  };

  return (
    <DialogContainer open={open} onClose={onClose}>
      <TitleWrapper>
        <Title>Додавання аніме</Title>
      </TitleWrapper>
      <InputWrapper>
        <TextField placeholder="Введіть назву аніме" value={anime} onChange={handleAnimeChange} />
      </InputWrapper>
      <Button variant="contained" disabled={anime.length < 3} onClick={handleSubmit}>
        Зберегти
      </Button>
    </DialogContainer>
  );
};

export default AddAnimeDialog;
