/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Formik } from 'formik';
import {
  Autocomplete,
  Checkbox,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Select,
  type DialogProps,
  InputLabel,
  FormControl,
} from '@mui/material';

import {
  CheckboxWrapper,
  ColorText,
  DialogContainer,
  DialogWrapper,
  DubControlWrapper,
  DubSelect,
  ErrorText,
  FormWrapper,
  Paragraph,
  PlusMinusWrapper,
  SubParagraph,
  Title,
  TitleWrapper,
} from './styles';
import Button from '@components/Button';
import InputField from '@components/InputField';
import { validate } from './validate';
import { AnimeTypeEnum, CoinsType, DubStatusEnum, ValuesType } from './types';
import { initialValuesSetup } from './const';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KBInputField from '@components/KBInputField';
import {
  getPartialValue,
  handleChangeCurrentEpisode,
  handleChangeDubFields,
  handleChangeDubStatus,
  isEpisodeValid,
  totalKbs,
  totalMainCoins,
} from './utils';
import useTracksStore from '@/stores/useTracksStore';
import useCofStore from '@/stores/useCofStore';
import useCoinsStore from '@/stores/useCoinsStore';
import useAnimeStore from '@/stores/useAnimeStore';
import AddAnimeDialog from '../AddAnimeDialog';
import { FlexWrapper } from '@/components/ListCard/styles';

const titleTypeOptions = [
  {
    label: 'Фільм',
    value: AnimeTypeEnum.FILM,
  },
  {
    label: 'Серіал',
    value: AnimeTypeEnum.SERIES,
  },
  {
    label: 'Короткометражка',
    value: AnimeTypeEnum.SHORT_FILM,
  },
];

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({ open, onClose }) => {
  const { cof, getCof } = useCofStore();
  const { coinsTypes, getCoins } = useCoinsStore();
  const { addTracks } = useTracksStore();
  const { animeNames, getAnime } = useAnimeStore();

  const [animeType, setAnimeType] = useState<AnimeTypeEnum>(AnimeTypeEnum.NONE);
  const [dubFields, setDubFields] = useState<number>(1);
  const [dubStatus, setDubStatus] = useState<DubStatusEnum>(DubStatusEnum.COOKIE);
  const [coins, setCoins] = useState<CoinsType>(coinsTypes.series);
  const [nameTitle, setNameTitle] = useState<string>('');
  const [currentEpisode, setCurrentEpisode] = useState<string>('1');
  const [note, setNote] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<ValuesType>(() => {
    return initialValuesSetup(nameTitle, cof, coins, currentEpisode);
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [isNextStep, setIsNextStep] = useState(false);

  useEffect(() => {
    getCof();
    getCoins();
    getAnime();
  }, []);

  useEffect(() => {
    switch (animeType) {
      case AnimeTypeEnum.FILM:
        return setCoins(coinsTypes.film);
      case AnimeTypeEnum.SERIES:
        return setCoins(coinsTypes.series);
      case AnimeTypeEnum.SHORT_FILM:
        return setCoins(coinsTypes.shortFilm);
    }
  }, [animeType, coinsTypes]);

  useEffect(() => {
    const updatedMain = initialValuesSetup(nameTitle, cof, coins, currentEpisode).main;

    Object.keys(updatedMain).forEach((key) => {
      updatedMain[key] = {
        ...updatedMain[key],
        nameTitle,
        currentEpisode: parseFloat(currentEpisode),
      };

      if (updatedMain[key].typeRole === 'director') {
        updatedMain[key].coin = coins.bonusDirector;
      }
    });

    setInitialValues((prev) => ({
      ...prev,
      main: updatedMain,
    }));
  }, [coins, nameTitle, currentEpisode]);

  useEffect(() => {
    const newDubFields = Object.keys(initialValues.main).filter((key) =>
      key.startsWith('dub')
    ).length;
    setDubFields(newDubFields);
  }, [initialValues]);

  useEffect(() => {
    if (animeType === AnimeTypeEnum.FILM || animeType === AnimeTypeEnum.SHORT_FILM) {
      setCurrentEpisode('1');
    }
  }, [animeType]);

  const handleClose = () => {
    setNameTitle('');
    setAnimeType(AnimeTypeEnum.NONE);
    setIsNextStep(false);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleSubmitForm = async (values: ValuesType) => {
    console.log(values);

    const payload = {
      membersInfo: Object.values(values.main).filter((value) => value.nickname !== ''),
      isFast: values.isFast,
      isOngoing: values.isOngoing,
      isPriority: values.isPriority,
      isInTime: values.isInTime,
    };

    try {
      await addTracks(payload);

      handleClose();
      toast.success('Успішно');
    } catch (e) {
      toast.error('Помилка');
    }
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
                disabled={
                  animeType === AnimeTypeEnum.FILM || animeType === AnimeTypeEnum.SHORT_FILM
                }
                type="text"
                onChange={(e) => handleChangeCurrentEpisode(e, setCurrentEpisode)}
              />
            </FlexWrapper>

            <Title>Аніме належить до:</Title>

            <FormControl>
              <InputLabel id="title-type">Тип</InputLabel>
              <Select
                labelId="title-type"
                value={animeType === AnimeTypeEnum.NONE ? '' : animeType}
                onChange={(e) => {
                  setAnimeType(e.target.value as AnimeTypeEnum);
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

            <Button onClick={() => setIsNextStep(true)} disabled={animeType === AnimeTypeEnum.NONE}>
              Далі
            </Button>

            <AddAnimeDialog onClose={() => setOpenDialog(false)} open={openDialog} />
          </>
        )}

        {isNextStep && (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={handleSubmitForm}
            validate={(values) => validate(values, coins, cof)}
          >
            {({ isValid, isSubmitting, isValidating, errors, values, handleChange }) => (
              <FormWrapper>
                <Button startIcon={<ArrowBackIcon />} onClick={() => setIsNextStep(false)}>
                  Назад
                </Button>
                <TitleWrapper>
                  <Title>
                    Крихти -{' '}
                    <ColorText>
                      {totalMainCoins(values)}/{coins.coin + coins.bonusDirector}
                    </ColorText>
                  </Title>
                </TitleWrapper>
                <Paragraph>Звукач:</Paragraph>
                <InputField name={'main.sound'} isDisabled={true} />
                <Paragraph>Куратор:</Paragraph>
                <InputField name={'main.director'} isDisabled={true} />
                <Paragraph>Переклад:</Paragraph>
                <InputField name={'main.sub'} isDisabled={true} />
                <DubControlWrapper>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Paragraph>Озвучення:</Paragraph>
                    <DubSelect
                      value={dubFields}
                      onChange={(e) =>
                        handleChangeDubFields(
                          e,
                          values,
                          nameTitle,
                          parseFloat(currentEpisode),
                          setInitialValues
                        )
                      }
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <MenuItem key={num} value={num}>
                          {num}
                        </MenuItem>
                      ))}
                    </DubSelect>
                  </div>
                  <DubSelect
                    value={dubStatus}
                    onChange={(e) => handleChangeDubStatus(e, setDubStatus)}
                  >
                    <MenuItem value={DubStatusEnum.KB}>{DubStatusEnum.KB}</MenuItem>
                    <MenuItem value={DubStatusEnum.COOKIE}>{DubStatusEnum.COOKIE}</MenuItem>
                  </DubSelect>
                </DubControlWrapper>
                <SubParagraph>
                  Для розподілу дозволено {getPartialValue(cof.dub, coins.coin)} крихт
                </SubParagraph>
                {dubStatus === DubStatusEnum.COOKIE &&
                  Array.from({ length: dubFields }, (_, i) => i).map((_, index) => (
                    <InputField name={`main.dub${index + 1}`} key={index} />
                  ))}
                {dubStatus === DubStatusEnum.KB &&
                  Array.from({ length: dubFields }, (_, i) => i).map((_, index) => (
                    <KBInputField
                      mainName={`main.dub${index + 1}`}
                      dubName={`dubs.${index}`}
                      key={index}
                      sumOfAllFiles={totalKbs(values)}
                      allPoints={getPartialValue(cof.dub, coins.coin)}
                    />
                  ))}
                <PlusMinusWrapper>
                  <Button
                    sx={{ padding: 0 }}
                    onClick={() => {
                      const newValue = Math.min(Math.max(dubFields + 1, 1), 20);
                      handleChangeDubFields(
                        {
                          target: { value: newValue },
                        } as SelectChangeEvent<unknown>,
                        values,
                        nameTitle,
                        parseFloat(currentEpisode),
                        setInitialValues
                      );
                    }}
                    disabled={dubFields >= 20}
                  >
                    +
                  </Button>

                  <Button
                    onClick={() => {
                      const newValue = Math.min(Math.max(dubFields - 1, 1), 20);
                      handleChangeDubFields(
                        {
                          target: { value: newValue },
                        } as SelectChangeEvent<unknown>,
                        values,
                        nameTitle,
                        parseFloat(currentEpisode),
                        setInitialValues
                      );
                    }}
                    disabled={dubFields <= 1}
                  >
                    -
                  </Button>
                </PlusMinusWrapper>
                <SubParagraph>
                  Для наступних ролей для розподілу дозволено{' '}
                  {getPartialValue(cof.additional, coins.coin)} крихт
                </SubParagraph>
                <Paragraph>Фіксер:</Paragraph>
                <InputField name={'main.fixer'} />
                <Paragraph>Розбивач ролей:</Paragraph>
                <InputField name={'main.roleBreaker'} />
                <Paragraph>Релізер:</Paragraph>
                <InputField name={'main.release'} />
                <Paragraph>Додаткова роль (не обов'язкова):</Paragraph>
                <InputField name={'main.another'} />
                <Paragraph>Нотатка:</Paragraph>
                <TextField
                  placeholder="Не обов'язкове поле"
                  value={note || ''}
                  onChange={(e) => setNote(e.target.value)}
                  sx={{ m: 1, width: '100%' }}
                />
                <CheckboxWrapper>
                  <Checkbox name="isFast" value={values.isFast} onChange={handleChange} />
                  <SubParagraph>Зроблено швидко</SubParagraph>

                  <Checkbox name="isOngoing" value={values.isOngoing} onChange={handleChange} />
                  <SubParagraph>Онґоїнґ</SubParagraph>
                </CheckboxWrapper>
                <CheckboxWrapper>
                  <Checkbox name="isPriority" value={values.isPriority} onChange={handleChange} />
                  <SubParagraph>Пріоритет</SubParagraph>

                  <Checkbox name="isInTime" value={values.isInTime} onChange={handleChange} />
                  <SubParagraph>Зроблено вчасно</SubParagraph>
                </CheckboxWrapper>

                {errors.main && (
                  <ErrorText>
                    <>{errors.main}</>
                  </ErrorText>
                )}
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting || isValidating || !isValid}
                >
                  Зберегти
                </Button>
              </FormWrapper>
            )}
          </Formik>
        )}
      </DialogWrapper>
    </DialogContainer>
  );
};

export default InputCookieDialog;
