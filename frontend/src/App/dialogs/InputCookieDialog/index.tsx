/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import {
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Snackbar,
  TextField,
  type DialogProps,
} from '@mui/material';
import {
  ButtonsWrapper,
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
  RowWrapper,
  SubParagraph,
  Title,
  TitleWrapper,
} from './styles';
import Button from '@components/Button';
import InputField from '@components/InputField';
import { Formik } from 'formik';
import { validate } from './validate';
import { AnimeStatusEnum, CoinsType, DubStatusEnum, ValuesType } from './types';
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

export interface IInputCookieDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const InputCookieDialog: FunctionComponent<IInputCookieDialogProps> = ({
  open,
  onClose,
}) => {
  const [animeStatus, setAnimeStatus] = useState<AnimeStatusEnum>(
    AnimeStatusEnum.NONE
  );
  const [dubFields, setDubFields] = useState<number>(1);
  const [dubStatus, setDubStatus] = useState<DubStatusEnum>(
    DubStatusEnum.COOKIE
  );
  const { cof, getCof } = useCofStore();
  const { coinsTypes, getCoins } = useCoinsStore();
  const [coins, setCoins] = useState<CoinsType>(coinsTypes.delayStandardAnime);
  const [nameTitle, setNameTitle] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState('1');
  const [note, setNote] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<ValuesType>(() => {
    return initialValuesSetup(nameTitle, cof, coins, currentEpisode);
  });
  const [isPopOpen, setPopOpen] = useState<boolean>(false);
  const [popMessage, setPopMessage] = useState('');
  const { addTracks } = useTracksStore();
  const { animeNames, getAnime } = useAnimeStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [isFast, setIsFast] = useState(false);

  useEffect(() => {
    getCof();
    getCoins();
    getAnime();
  }, []);

  useEffect(() => {
    if (animeStatus === AnimeStatusEnum.FILM) {
      setCoins(coinsTypes.film);
    } else if (animeStatus === AnimeStatusEnum.DELAY) {
      setCoins(coinsTypes.delayStandardAnime);
    } else if (animeStatus === AnimeStatusEnum.STANDART) {
      setCoins(coinsTypes.inTimeStandardAnime);
    }
  }, [animeStatus, coinsTypes]);

  useEffect(() => {
    const updatedMain = initialValuesSetup(
      nameTitle,
      cof,
      coins,
      currentEpisode
    ).main;

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

  return (
    <DialogContainer open={open} scroll={'body'} onClose={onClose}>
      <DialogWrapper>
        {animeStatus === AnimeStatusEnum.NONE && (
          <>
            <Title>Назва тайтлу і номер епізоду</Title>
            <RowWrapper>
              <FormControl>
                <InputLabel id="name-label">Аніме</InputLabel>
                <Select
                  id="name-label"
                  value={nameTitle}
                  onChange={(e) => setNameTitle(e.target.value)}
                  input={<OutlinedInput label="Аніме" />}
                  placeholder="Вкажіть назву тайтлу"
                  sx={{ minWidth: '150px', maxWidth: '230px' }}
                >
                  {animeNames.map((animeName) => (
                    <MenuItem key={animeName._id} value={animeName._id}>
                      {animeName._id}
                    </MenuItem>
                  ))}
                  <MenuItem
                    sx={{ fontWeight: '600' }}
                    value={''}
                    onClick={() => setOpenDialog(true)}
                  >
                    Додати
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                error={!isEpisodeValid(currentEpisode)}
                placeholder="Епізод"
                value={currentEpisode || ''}
                type="text"
                sx={{ width: '85px' }}
                onChange={(e) =>
                  handleChangeCurrentEpisode(e, setCurrentEpisode)
                }
              />
            </RowWrapper>
            <Title>Аніме належить до:</Title>
            <ButtonsWrapper>
              <Button
                variant="contained"
                disabled={
                  nameTitle.length < 3 || !isEpisodeValid(currentEpisode)
                }
                onClick={() => setAnimeStatus(AnimeStatusEnum.STANDART)}
              >
                Серіал
              </Button>
              <Button
                variant="contained"
                disabled={
                  nameTitle.length < 3 || !isEpisodeValid(currentEpisode)
                }
                onClick={() => setAnimeStatus(AnimeStatusEnum.FILM)}
              >
                Фільм
              </Button>
            </ButtonsWrapper>
            <AddAnimeDialog
              onClose={() => setOpenDialog(false)}
              open={openDialog}
            />
          </>
        )}

        {animeStatus !== AnimeStatusEnum.NONE && (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={async (values) => {
              try {
                const valuesArray = [...Object.values(values.main)].filter(
                  (value) => value.nickname !== ''
                );
                const updValuesArray = valuesArray.map((value) => {
                  const updatedCoins = isFast ? Math.round(value.coin * 1.2) : value.coin;
                  return {
                    ...value,
                    note,
                    coin: updatedCoins,
                  };
                });
                await addTracks(updValuesArray);
                // alert(JSON.stringify(updValuesArray, null, 2));
                setPopMessage('Успішно');
                setPopOpen(true);
                setTimeout(() => {
                  onClose();
                }, 1000);
              } catch (e) {
                setPopMessage('Помилка');
                setPopOpen(true);
              }
            }}
            validate={(values) => validate(values, coins, cof)}
          >
            {({ isValid, isSubmitting, isValidating, errors, values }) => (
              <FormWrapper>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setAnimeStatus(AnimeStatusEnum.NONE)}
                >
                  Назад
                </Button>
                <TitleWrapper>
                  <Title>
                    Крихти -{' '}
                    <ColorText>
                      {totalMainCoins(values)}/
                      {coins.coin + coins.bonusDirector}
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
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(
                        (num) => (
                          <MenuItem key={num} value={num}>
                            {num}
                          </MenuItem>
                        )
                      )}
                    </DubSelect>
                  </div>
                  <DubSelect
                    value={dubStatus}
                    onChange={(e) => handleChangeDubStatus(e, setDubStatus)}
                  >
                    <MenuItem value={DubStatusEnum.KB}>
                      {DubStatusEnum.KB}
                    </MenuItem>
                    <MenuItem value={DubStatusEnum.COOKIE}>
                      {DubStatusEnum.COOKIE}
                    </MenuItem>
                  </DubSelect>
                </DubControlWrapper>
                <SubParagraph>
                  Для розподілу дозволено {getPartialValue(cof.dub, coins.coin)}{' '}
                  крихт
                </SubParagraph>
                {dubStatus === DubStatusEnum.COOKIE &&
                  Array.from({ length: dubFields }, (_, i) => i).map(
                    (_, index) => (
                      <InputField name={`main.dub${index + 1}`} key={index} />
                    )
                  )}
                {dubStatus === DubStatusEnum.KB &&
                  Array.from({ length: dubFields }, (_, i) => i).map(
                    (_, index) => (
                      <KBInputField
                        mainName={`main.dub${index + 1}`}
                        dubName={`dubs.${index}`}
                        key={index}
                        sumOfAllFiles={totalKbs(values)}
                        allPoints={getPartialValue(cof.dub, coins.coin)}
                      />
                    )
                  )}
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
                  <Checkbox value={isFast} onChange={() => setIsFast(!isFast)}/>
                  <SubParagraph>Зроблено швидко</SubParagraph>
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
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={isPopOpen}
        autoHideDuration={2000}
        onClose={() => setPopOpen(false)}
        message={popMessage}
      />
    </DialogContainer>
  );
};

export default InputCookieDialog;
