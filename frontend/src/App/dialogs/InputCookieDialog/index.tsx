import { FunctionComponent, useEffect, useState } from 'react';
import {
  Autocomplete,
  MenuItem,
  TextField,
  Select,
  type DialogProps,
  InputLabel,
  FormControl,
} from '@mui/material';

import { DialogContainer, DialogWrapper, Title } from './styles';
import Button from '@components/Button';
import { ANIME_TYPE } from './types';
import { handleChangeCurrentEpisode, isEpisodeValid } from './utils';
import useAnimeStore from '@/stores/useAnimeStore';
import AddAnimeDialog from '../AddAnimeDialog';
import { FlexWrapper } from '@/components/ListCard/styles';
import { CreateTrackForm } from './components/CreateTrackForm';
import useCoinsStore from '@/stores/useCoinsStore';

const titleTypeOptions = [
  {
    label: 'Фільм',
    value: ANIME_TYPE.FILM,
  },
  {
    label: 'Серіал',
    value: ANIME_TYPE.SERIES,
  },
  {
    label: 'Короткометражка',
    value: ANIME_TYPE.SHORT_FILM,
  },
];

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({ open, onClose }) => {
  const { animeNames, getAnime } = useAnimeStore();
  const { getCoins } = useCoinsStore();

  const [animeType, setAnimeType] = useState<ANIME_TYPE>(ANIME_TYPE.NONE);

  const [nameTitle, setNameTitle] = useState<string>('');
  const [currentEpisode, setCurrentEpisode] = useState<string>('1');
  const [openDialog, setOpenDialog] = useState(false);
  const [isNextStep, setIsNextStep] = useState(false);

  useEffect(() => {
    getAnime();
    getCoins();
  }, []);

  useEffect(() => {
    if (animeType === ANIME_TYPE.FILM || animeType === ANIME_TYPE.SHORT_FILM) {
      setCurrentEpisode('1');
    }
  }, [animeType]);

  const handleClose = () => {
    setNameTitle('');
    setAnimeType(ANIME_TYPE.NONE);
    setIsNextStep(false);
    onClose();
  };

  return (
    <DialogContainer open={open} scroll={'body'} onClose={onClose} fullWidth>
      <DialogWrapper>
        {!isNextStep && (
          <>
            <Title>Назва тайтлу і номер епізоду</Title>
            <FlexWrapper>
              <Autocomplete
                options={animeNames}
                getOptionLabel={(option) => option.name}
                value={nameTitle ? animeNames.find((anime) => anime.name === nameTitle) : null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setNameTitle(newValue.name);
                  } else {
                    setNameTitle('');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Аніме"
                    placeholder="Вкажіть назву тайтлу"
                    variant="outlined"
                  />
                )}
                sx={{ minWidth: '85%', maxWidth: '95%' }}
                renderOption={(props, option) => (
                  <MenuItem {...props} key={option._id} value={option._id}>
                    {option.name}
                  </MenuItem>
                )}
                noOptionsText={
                  <MenuItem sx={{ fontWeight: '600' }} onClick={() => setOpenDialog(true)}>
                    Додати
                  </MenuItem>
                }
              />

              <TextField
                error={!isEpisodeValid(currentEpisode)}
                placeholder="Епізод"
                value={currentEpisode || ''}
                disabled={animeType === ANIME_TYPE.FILM || animeType === ANIME_TYPE.SHORT_FILM}
                type="text"
                onChange={(e) => handleChangeCurrentEpisode(e, setCurrentEpisode)}
              />
            </FlexWrapper>

            <Title>Аніме належить до:</Title>

            <FormControl>
              <InputLabel id="title-type">Тип</InputLabel>
              <Select
                labelId="title-type"
                value={animeType === ANIME_TYPE.NONE ? '' : animeType}
                onChange={(e) => {
                  setAnimeType(e.target.value as ANIME_TYPE);
                }}
                disabled={nameTitle.length < 3 || !isEpisodeValid(currentEpisode)}
              >
                {titleTypeOptions.map((type) => (
                  <MenuItem value={type.value} key={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button onClick={() => setIsNextStep(true)} disabled={animeType === ANIME_TYPE.NONE}>
              Далі
            </Button>

            <AddAnimeDialog onClose={() => setOpenDialog(false)} open={openDialog} />
          </>
        )}

        {isNextStep && (
          <CreateTrackForm
            onBack={() => setIsNextStep(false)}
            titleName={nameTitle}
            currentEpisode={currentEpisode}
            onClose={handleClose}
            animeType={animeType}
          />
        )}
      </DialogWrapper>
    </DialogContainer>
  );
};

export default InputCookieDialog;
