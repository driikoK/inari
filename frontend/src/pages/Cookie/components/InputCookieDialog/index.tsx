import { FunctionComponent, useEffect, useState } from 'react';

import { type DialogProps } from '@mui/material';

import { ChooseAnimeFormValues } from './types';
import { CreateTrackForm } from './components/CreateTrackForm';
import { ChooseAnimeForm } from './components/ChooseAnimeForm';
import { useAnimeStore, useCoinsStore } from '@/stores';
import { ANIME_TYPE } from '@/types';
import { CustomDialog } from '@/components';

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({ open, onClose }) => {
  const { getAnimes } = useAnimeStore();
  const { getCoins } = useCoinsStore();
  const [isNextStep, setIsNextStep] = useState(false);
  const [chosenAnime, setChosenAnime] = useState<ChooseAnimeFormValues | null>(null);

  useEffect(() => {
    getAnimes();
    getCoins();
  }, []);

  const handleCreateTrackClose = () => {
    onClose();
    setIsNextStep(false);
    setChosenAnime(null);
  };

  const saveFormValues = (values: ChooseAnimeFormValues) => {
    setChosenAnime(values);
    setIsNextStep(true);
  };

  return (
    <CustomDialog
      onClose={onClose}
      open={open}
      onBack={() => setIsNextStep(false)}
      isShowBack={isNextStep}
    >
      {!isNextStep && (
        <ChooseAnimeForm saveFormValues={saveFormValues} initialValues={chosenAnime} />
      )}

      {isNextStep && chosenAnime && (
        <CreateTrackForm
          onClose={handleCreateTrackClose}
          {...chosenAnime}
          animeType={chosenAnime.animeType as ANIME_TYPE}
          episode={chosenAnime.episode.toString()}
          duration={chosenAnime.duration}
        />
      )}
    </CustomDialog>
  );
};

export default InputCookieDialog;
