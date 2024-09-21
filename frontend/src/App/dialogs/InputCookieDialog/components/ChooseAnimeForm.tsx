import { FC, useEffect, useState } from 'react';
import { useForm, FormProvider, Controller, ControllerRenderProps } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';

import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import { ANIME_TYPE, ChooseAnimeFormValues } from '../types';
import { DialogWrapper, ErrorText, Title } from '../styles';
import useUsersStore from '@/stores/useUsersStore';
import { FlexWrapper } from '@/components/ListCard/styles';
import Button from '@components/Button';
import useAnimeStore from '@/stores/useAnimeStore';
import AddAnimeDialog from '../../AddAnimeDialog';
import {
  seasonOptions,
  titleTypeOptions,
  yearOptions,
  chooseAnimeInitialFormValues,
  createChooseAnimeForm,
} from '../const';

interface FormProps {
  saveFormValues: (values: ChooseAnimeFormValues) => void;
  initialValues: ChooseAnimeFormValues | null;
}

export const ChooseAnimeForm: FC<FormProps> = ({ saveFormValues, initialValues }) => {
  const { getUsers } = useUsersStore();
  const { animeNames, getAnime } = useAnimeStore();

  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    getUsers();
  }, []);

  // console.log(initialValues);

  const methods = useForm<ChooseAnimeFormValues>({
    defaultValues: initialValues ? initialValues : chooseAnimeInitialFormValues,
    resolver: yupResolver(createChooseAnimeForm()),
    criteriaMode: 'all',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    watch,
    resetField,
    control,
    formState: { isValid, errors },
  } = methods;

  const watchAnimeType = watch('animeType');

  useEffect(() => {
    if (watchAnimeType === ANIME_TYPE.FILM || watchAnimeType === ANIME_TYPE.SHORT_FILM) {
      resetField('episode');
    }
  }, [watchAnimeType]);

  const handleEpisodeChange = (
    value: string,
    currentField: ControllerRenderProps<ChooseAnimeFormValues, 'episode'>
  ) => {
    const numberValue = Number(value.replace(/[^0-9]/g, ''));

    if (numberValue > 999) return;

    currentField.onChange(numberValue);
  };

  const onSubmitForm = (form: ChooseAnimeFormValues) => {
    saveFormValues(form);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogWrapper>
          <Title>Назва тайтлу і номер епізоду</Title>

          <FlexWrapper>
            <Controller
              control={control}
              name="titleName"
              render={({ field }) => (
                <Autocomplete
                  options={animeNames}
                  getOptionLabel={(option) => option.name}
                  value={animeNames.find((anime) => anime.name === field.value) || null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.name);
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
              )}
            />

            <Controller
              control={control}
              name="episode"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  disabled={
                    watchAnimeType === ANIME_TYPE.FILM || watchAnimeType === ANIME_TYPE.SHORT_FILM
                  }
                  type="text"
                  onChange={(e) => {
                    handleEpisodeChange(e.target.value, field);
                  }}
                />
              )}
            />
          </FlexWrapper>

          <ErrorMessage
            name="episode"
            errors={errors}
            render={({ message }) => <ErrorText>{message}</ErrorText>}
          />

          <Title>Аніме належить до:</Title>

          <FormControl>
            <InputLabel id="title-type">Тип</InputLabel>

            <Controller
              control={control}
              name="animeType"
              render={({ field }) => (
                <Select
                  labelId="title-type"
                  value={field.value === ANIME_TYPE.NONE ? '' : field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value as ANIME_TYPE);
                  }}
                  sx={{ width: '100%' }}
                >
                  {titleTypeOptions.map((type) => (
                    <MenuItem value={type.value} key={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          <Title>У якому сезоні робилося:</Title>

          <FlexWrapper>
            <FormControl sx={{ width: '50%' }}>
              <InputLabel id="season">Сезон</InputLabel>

              <Controller
                control={control}
                name="season"
                render={({ field }) => (
                  <Select labelId="season" sx={{ width: '100%' }} variant="outlined" {...field}>
                    {seasonOptions.map((type) => (
                      <MenuItem value={type.value} key={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            <FormControl sx={{ width: '50%' }}>
              <InputLabel id="year">Рік</InputLabel>

              <Controller
                control={control}
                name="year"
                render={({ field }) => (
                  <Select labelId="year" placeholder="Рік" sx={{ width: '100%' }} {...field}>
                    {yearOptions.map((type) => (
                      <MenuItem value={type.value} key={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </FlexWrapper>

          <Button type="submit" color="inherit" disabled={!isValid}>
            Далі
          </Button>

          <AddAnimeDialog onClose={() => setOpenDialog(false)} open={openDialog} />
        </DialogWrapper>
      </form>
    </FormProvider>
  );
};
