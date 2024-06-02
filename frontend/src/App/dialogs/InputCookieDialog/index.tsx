/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import { Input, MenuItem, Snackbar, type DialogProps } from '@mui/material';
import {
  ButtonsWrapper,
  ColorText,
  DialogContainer,
  DialogWrapper,
  DubControlWrapper,
  DubSelect,
  DubTextField,
  ErrorText,
  FormWrapper,
  Paragraph,
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
import { handleChangeDubFields, handleChangeDubStatus, handleChangeNameTitle, totalBonusCoins, totalKbs, totalMainCoins } from './utils';
import useTracksStore from '@/stores/useTracksStore';
import useCofStore from '@/stores/useCofStore';
import useCoinsStore from '@/stores/useCoinsStore';

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
  const [dubStatus, setDubStatus] = useState<DubStatusEnum>(DubStatusEnum.COOKIE);
  const { cof, getCof } = useCofStore();
  const { coinsTypes, getCoins } = useCoinsStore();
  const [coins, setCoins] = useState<CoinsType>(coinsTypes.delayStandardAnime);
  const [nameTitle, setNameTitle] = useState('');
  const [initialValues, setInitialValues] = useState<ValuesType>(() => {
    return initialValuesSetup(nameTitle, cof, coins);
  });
  const [isPopOpen, setPopOpen] = useState<boolean>(false);
  const [popMessage, setPopMessage] = useState('');
  const { addTracks } = useTracksStore()

  useEffect(() => {
    getCof();
    getCoins();
  }, [])

  useEffect(() => {
    setInitialValues(() => {
      return initialValuesSetup(nameTitle, cof, coins);
    });
  }, [cof]);
  
  useEffect(() => {
    if (animeStatus === AnimeStatusEnum.FILM) {
      setCoins(coinsTypes.film);
    } else if (animeStatus === AnimeStatusEnum.DELAY) {
      setCoins(coinsTypes.delayStandardAnime);
    } else if (animeStatus === AnimeStatusEnum.STANDART) {
      setCoins(coinsTypes.inTimeStandardAnime);
    }
  }, [animeStatus]);

  useEffect(() => {
    const updatedMain = { ...initialValues.main };
    const updatedBonus = { ...initialValues.bonus };

    Object.keys(updatedMain).forEach((key) => {
      updatedMain[key] = { ...updatedMain[key], nameTitle };
    });

    Object.keys(updatedBonus).forEach((key) => {
      updatedBonus[key] = { ...updatedBonus[key], nameTitle };

      if (updatedBonus[key].typeRole === 'director') {
        updatedBonus[key].coin = coins.BonusDirector;
      }
    });

    setInitialValues(prev => ({
      ...prev,
      main: updatedMain,
      bonus: updatedBonus,
    }));
  }, [coins, nameTitle]);

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
            <Title>Назва тайтлу</Title>
            <Input
              placeholder="Вкажіть назву тайтлу"
              value={nameTitle}
              onChange={(e) => handleChangeNameTitle(e, setNameTitle)}
            />
            <Title>Серія виконана за</Title>
            <ButtonsWrapper>
              <Button
                variant="contained"
                disabled={nameTitle.length < 3}
                onClick={() => setAnimeStatus(AnimeStatusEnum.STANDART)}
              >
                3 дні
              </Button>
              <Button
                variant="contained"
                disabled={nameTitle.length < 3}
                onClick={() => setAnimeStatus(AnimeStatusEnum.DELAY)}
              >
                3+ дні
              </Button>
              <Button
                variant="contained"
                disabled={nameTitle.length < 3}
                onClick={() => setAnimeStatus(AnimeStatusEnum.FILM)}
              >
                фільм
              </Button>
            </ButtonsWrapper>
          </>
        )}

        {animeStatus !== AnimeStatusEnum.NONE && (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={async (values) => {
              try {
                const valuesArray = [
                  ...Object.values(values.main),
                  ...Object.values(values.bonus),
                ];
                await addTracks(valuesArray);

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
                    Основні крихти -{' '}
                    <ColorText>
                      {totalMainCoins(values)}/{coins.coin}
                    </ColorText>
                  </Title>
                </TitleWrapper>
                <DubControlWrapper>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Paragraph>Озвучення:</Paragraph>
                    <DubTextField
                      value={dubFields}
                      onChange={(e) =>
                        handleChangeDubFields(
                          e,
                          initialValues,
                          setInitialValues,
                          nameTitle
                        )
                      }
                    />
                    <Paragraph>(ліміт: 1-20)</Paragraph>
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
                        allPoints={cof.dub}
                      />
                    )
                  )}
                <Paragraph>Переклад:</Paragraph>
                <InputField name={'main.sub'} isDisabled={true} />
                <Paragraph>Звукач:</Paragraph>
                <InputField name={'main.sound'} isDisabled={true} />
                {errors.main && (
                  <ErrorText>
                    <>{errors.main}</>
                  </ErrorText>
                )}
                <TitleWrapper>
                  <Title>
                    Бонусні крихти -{' '}
                    <ColorText>
                      {totalBonusCoins(values)}/{coins.coinBonus}
                    </ColorText>
                  </Title>
                </TitleWrapper>
                <Paragraph>Куратор:</Paragraph>
                <InputField name={'bonus.director'} isDisabled={true} />
                <Paragraph>Фіксер:</Paragraph>
                <InputField name={'bonus.fixer'} />
                <Paragraph>Розбивач ролей:</Paragraph>
                <InputField name={'bonus.roleBreaker'} />
                <Paragraph>Релізер:</Paragraph>
                <InputField name={'bonus.release'} />
                <Paragraph>Перекладач:</Paragraph>
                <InputField name={'bonus.sub'} />
                <Paragraph>Звукач:</Paragraph>
                <InputField name={'bonus.sound'} />
                <Paragraph>Озвучення:</Paragraph>
                {Array.from({ length: dubFields }, (_, i) => i).map(
                  (_, index) => (
                    <InputField name={`bonus.dub${index + 1}`} key={index} />
                  )
                )}
                {errors.bonus && (
                  <ErrorText>
                    <>{errors.bonus}</>
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
