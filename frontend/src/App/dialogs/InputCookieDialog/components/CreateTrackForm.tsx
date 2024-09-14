import { FC, useEffect, useMemo, useState } from 'react';
import { Form, Formik } from 'formik';

import { Box, Button, Checkbox, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { FormField } from './FormField';
import { createTrackFormSchema, initialFormValues } from '../const';
import { CreateTrackFormValues } from '../types';
import { CheckboxWrapper, ColorText, SubParagraph, Title, TitleWrapper } from '../styles';
import { totalMainCoins } from '../utils';
import useUsersStore from '@/stores/useUsersStore';
import useCoinsStore from '@/stores/useCoinsStore';
import { CoinsType } from '@/types';
import { PlusMinusButton } from './PlusMinusButton';

interface CreateTrackFormProps {
  titleName: string;
  currentEpisode: number;
}

export const CreateTrackForm: FC<CreateTrackFormProps> = ({ titleName, currentEpisode }) => {
  const { getUsers } = useUsersStore();

  const { coinsTypes, getCoins } = useCoinsStore();

  const [coins, setCoins] = useState<CoinsType>(coinsTypes.series);

  useEffect(() => {
    getUsers();
  }, []);

  const initialValues: CreateTrackFormValues = initialFormValues;

  const handleSubmit = (form: CreateTrackFormValues) => {
    console.log(form, 'form');
  };

  return (
    <Formik
      validationSchema={createTrackFormSchema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      {({ isValid, isSubmitting, isValidating, errors, values, handleChange }) => {
        // console.log(values);

        console.log(errors);

        return (
          <Form>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* <Button startIcon={<ArrowBackIcon />} onClick={() => setIsNextStep(false)}> */}
              <Button
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: 'black',
                  fontSize: '16px',
                  alignSelf: 'flex-start',
                }}
              >
                <Title>Назад</Title>
              </Button>
              <TitleWrapper>
                <Title>
                  Крихти -{' '}
                  <ColorText>
                    {/* {totalMainCoins(values)}/{coins.coin + coins.bonusDirector} */}
                    {123123123}
                  </ColorText>
                </Title>
              </TitleWrapper>

              <FormField name="sound" label="Звукач" />
              <FormField name="director" label="Куратор" />
              <FormField name="sub" label="Перекладач" />
              <FormField name="editor" label="Редактор" />

              <FormField name="dubs" label="Дабери" isArray />
              <PlusMinusButton name="dubs" maxValue={10} />

              <FormField name="fixer" label="Фіксер" />
              <FormField name="roleBreaker" label="Розбивач ролей" />

              <FormField name="releasers" label="Релізери" isArray />
              <PlusMinusButton name="releasers" maxValue={2} />

              <FormField name="another" label="Додаткова роль (не обов'язкова)" />

              <TextField
                placeholder="Не обов'язкове поле"
                name="note"
                sx={{ width: '100%' }}
                multiline
                rows={4}
              />

              <Box>
                <CheckboxWrapper>
                  <Checkbox name="isFast" value={values.isFast} onChange={handleChange} />
                  <SubParagraph>Зроблено швидко</SubParagraph>

                  <Checkbox name="isOngoing" value={values.isOngoing} onChange={handleChange} />
                  <SubParagraph>Онґоїнґ</SubParagraph>
                </CheckboxWrapper>

                <Checkbox name="isPriority" value={values.isPriority} onChange={handleChange} />
                <SubParagraph>Пріоритет</SubParagraph>

                <Checkbox name="isInTime" value={values.isInTime} onChange={handleChange} />
                <SubParagraph>Зроблено вчасно</SubParagraph>
                <CheckboxWrapper></CheckboxWrapper>
              </Box>

              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting || isValidating || !isValid}
              >
                Зберегти
              </Button>
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
};
