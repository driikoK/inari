import { FunctionComponent, useEffect, useState } from 'react';
import { IconButton, type DialogProps } from '@mui/material';
import Close from '@mui/icons-material/Close';

import { DialogContainer, DialogWrapper } from './styles';
import { ChooseAnimeFormValues } from './types';
import useAnimeStore from '@/stores/useAnimeStore';
import useCoinsStore from '@/stores/useCoinsStore';
import { ANIME_TYPE } from '@/types';
import { CreateTrackForm } from './components/CreateTrackForm';
import { ChooseAnimeForm } from './components/ChooseAnimeForm';

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({ open, onClose }) => {
  const { getAnime } = useAnimeStore();
  const { getCoins } = useCoinsStore();
  const [isNextStep, setIsNextStep] = useState(false);
  const [chosenAnime, setChosenAnime] = useState<ChooseAnimeFormValues | null>(null);

  useEffect(() => {
    getAnime();
    getCoins();
  }, []);

  const handleClose = () => {
    onClose();
    setIsNextStep(false);
    setChosenAnime(null);
  };

  const saveFormValues = (values: ChooseAnimeFormValues) => {
    setChosenAnime(values);
    setIsNextStep(true);
  };

  return (
    <DialogContainer open={open} scroll={'body'} onClose={onClose} fullWidth>
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

      <DialogWrapper>
        {!isNextStep && (
          <ChooseAnimeForm saveFormValues={saveFormValues} initialValues={chosenAnime} />
        )}

        {isNextStep && chosenAnime && (
          <CreateTrackForm
            onBack={() => setIsNextStep(false)}
            onClose={handleClose}
            {...chosenAnime}
            animeType={chosenAnime.animeType as ANIME_TYPE}
            episode={chosenAnime.episode.toString()}
            duration={chosenAnime.duration}
          />
        )}
      </DialogWrapper>
    </DialogContainer>
  );
};

export default InputCookieDialog;
