import { FC, useEffect, useState } from 'react';
import { useForm, FormProvider, Controller, ControllerRenderProps } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';

import { Autocomplete, FormControl, MenuItem, TextField } from '@mui/material';

import { ChooseAnimeFormValues } from '../types';
import { DialogWrapper, FlexColumn } from '../styles';
import { titleTypeOptions, chooseAnimeInitialFormValues, createChooseAnimeForm } from '../const';
import AddAnimeDialog from '../../AddAnimeDialog';
import { FlexWrapper } from '@/components/ListCard/styles';
import Button from '@components/Button';
import SelectField from '@/components/SelectField';
import useMembersStore from '@/stores/useMembersStore';
import useAnimeStore from '@/stores/useAnimeStore';
import useTracksStore from '@/stores/useTracksStore';
import { seasonOptions, yearOptions } from '@/consts';
import { ANIME_TYPE } from '@/types';
import H6 from '@/components/Typography/H6';
import ErrorText from '@/components/Typography/ErrorText';

interface FormProps {
  saveFormValues: (values: ChooseAnimeFormValues) => void;
  initialValues: ChooseAnimeFormValues | null;
}

export const ChooseAnimeForm: FC<FormProps> = ({ saveFormValues, initialValues }) => {
  const { getMembers } = useMembersStore();
  const { animeNames } = useAnimeStore();
  const { resetLastTracks, getLastTracks, lastTracks } = useTracksStore();

  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    getMembers();
  }, []);

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
    reset,
    control,
    setValue,
    formState: { errors },
  } = methods;

  const watchTitleName = watch('titleName');
  const watchAnimeType = watch('animeType');
  const watchEpisode = watch('episode');

  useEffect(() => {
    if (!watchTitleName) {
      resetLastTracks();
      reset(chooseAnimeInitialFormValues);
      return;
    }

    const numberEpisode = Number(watchEpisode);
    if (numberEpisode > 1) {
      getLastTracks({ titleName: watchTitleName, episode: numberEpisode });
    }
  }, [watchTitleName, watchEpisode]);

  useEffect(() => {
    if (!lastTracks.length || !watchTitleName) return;

    const existedTrack = lastTracks[0];

    setValue('animeType', existedTrack.titleType);
    setValue('season', existedTrack.season);
    setValue('year', existedTrack.year.toString());
  }, [lastTracks.length, watchTitleName]);

  useEffect(() => {
    if (watchAnimeType === ANIME_TYPE.FILM || watchAnimeType === ANIME_TYPE.SHORT_FILM) {
      resetField('episode');
    }

    if (watchAnimeType !== ANIME_TYPE.SHORT_FILM) resetField('duration');
  }, [watchAnimeType]);

  const handleTextInputChange = (
    value: string,
    currentField:
      | ControllerRenderProps<ChooseAnimeFormValues, 'episode'>
      | ControllerRenderProps<ChooseAnimeFormValues, 'duration'>
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
          <H6>Назва тайтлу та номер епізоду</H6>
          <div>
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
                      field.onChange(newValue?.name || '');
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
                      watchAnimeType === ANIME_TYPE.FILM ||
                      watchAnimeType === ANIME_TYPE.SHORT_FILM ||
                      !watchTitleName
                    }
                    type="text"
                    onChange={(e) => {
                      handleTextInputChange(e.target.value, field);
                    }}
                  />
                )}
              />
            </FlexWrapper>

            <FlexColumn>
              <ErrorMessage
                errors={errors}
                name="titleName"
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
              <ErrorMessage
                name="episode"
                errors={errors}
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
            </FlexColumn>
          </div>

          <H6>Тип аніме:</H6>

          <FormControl>
            <Controller
              control={control}
              name="animeType"
              render={({ field }) => (
                <SelectField
                  label="Тип"
                  options={titleTypeOptions.map((type) => ({
                    value: type.value,
                    label: type.label,
                  }))}
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={!watchTitleName}
                />
              )}
            />

            <ErrorMessage
              errors={errors}
              name="animeType"
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </FormControl>

          {watchAnimeType === ANIME_TYPE.SHORT_FILM && (
            <>
              <H6>Тривалість (хв):</H6>

              <Controller
                control={control}
                name="duration"
                render={({ field }) => (
                  <TextField
                    value={field.value}
                    type="text"
                    placeholder="1"
                    onChange={(e) => {
                      handleTextInputChange(e.target.value, field);
                    }}
                    sx={{ width: '15%' }}
                    disabled={!watchTitleName}
                  />
                )}
              />

              <ErrorMessage
                name="duration"
                errors={errors}
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
            </>
          )}

          <H6>У якому сезоні робилося:</H6>

          <FlexWrapper>
            <FormControl sx={{ width: '50%' }}>
              <Controller
                control={control}
                name="season"
                render={({ field }) => (
                  <SelectField
                    label="Сезон"
                    options={seasonOptions.map((season) => ({
                      value: season.value,
                      label: season.label,
                    }))}
                    value={field.value || ''}
                    onChange={field.onChange}
                    disabled={!watchTitleName}
                  />
                )}
              />

              <ErrorMessage
                errors={errors}
                name="season"
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
            </FormControl>

            <FormControl sx={{ width: '50%' }}>
              <Controller
                control={control}
                name="year"
                render={({ field }) => (
                  <SelectField
                    label="Рік"
                    options={yearOptions.map((year) => ({
                      value: year.value,
                      label: year.label,
                    }))}
                    value={field.value || ''}
                    onChange={field.onChange}
                    disabled={!watchTitleName}
                  />
                )}
              />

              <ErrorMessage
                errors={errors}
                name="year"
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
            </FormControl>
          </FlexWrapper>

          <Button type="submit" color="inherit">
            Далі
          </Button>

          <AddAnimeDialog onClose={() => setOpenDialog(false)} open={openDialog} />
        </DialogWrapper>
      </form>
    </FormProvider>
  );
};
