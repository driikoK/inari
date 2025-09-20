import { FunctionComponent, useEffect, useState } from 'react';

import { type DialogProps } from '@mui/material';

import { ChooseAnimeFormValues } from './types';
import { CreateTrackForm } from './components/CreateTrackForm';
import { ChooseAnimeForm } from './components/ChooseAnimeForm';
import { useAnimesStore, useCoinsStore } from '@/stores';
import { ANIME_TYPE } from '@/types';
import { CustomDialog } from '@/components';
import { CreateTrackWithOnlySubsForm } from './components/CreateTrackWithOnlySubsForm';

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({ open, onClose }) => {
  const getAnimes = useAnimesStore((state) => state.getAnimes);
  const getCoins = useCoinsStore((state) => state.getCoins);
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

  useEffect(() => {
    if (!isNextStep) setChosenAnime(null);
  }, [isNextStep]);

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

      {chosenAnime && chosenAnime.isSubsOnly && (
        <CreateTrackWithOnlySubsForm
          onClose={handleCreateTrackClose}
          {...chosenAnime}
          animeType={chosenAnime.animeType as ANIME_TYPE}
          episode={chosenAnime.episode.toString()}
        />
      )}

      {chosenAnime && !chosenAnime.isSubsOnly && (
        <CreateTrackForm
          onClose={handleCreateTrackClose}
          {...chosenAnime}
          animeType={chosenAnime.animeType as ANIME_TYPE}
          episode={chosenAnime.episode.toString()}
        />
      )}
    </CustomDialog>
  );
};

export default InputCookieDialog;
