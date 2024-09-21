import { FunctionComponent, useEffect, useState } from 'react';
import { type DialogProps } from '@mui/material';

import { DialogContainer, DialogWrapper } from './styles';
import { ANIME_TYPE, ChooseAnimeFormValues } from './types';
import useAnimeStore from '@/stores/useAnimeStore';
import useCoinsStore from '@/stores/useCoinsStore';
import { CreateTrackForm } from './components/CreateTrackForm';
import { ChooseAnimeForm } from './components/ChooseAnimeForm';

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({ open, onClose }) => {
  const { animeNames, getAnime } = useAnimeStore();
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
  };

  const saveFormValues = (values: ChooseAnimeFormValues) => {
    setChosenAnime(values);
    setIsNextStep(true);
  };

  return (
    <DialogContainer open={open} scroll={'body'} onClose={onClose} fullWidth>
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
          />
        )}
      </DialogWrapper>
    </DialogContainer>
  );
};

export default InputCookieDialog;
