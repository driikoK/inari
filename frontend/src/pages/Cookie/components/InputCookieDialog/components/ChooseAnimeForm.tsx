import { FC, useEffect } from 'react';
import { useForm, FormProvider, Controller, ControllerRenderProps } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';

import { ChooseAnimeFormValues } from '../types';
import { DialogFormWrapper, FlexColumn, FlexRow } from '../styles';
import { chooseAnimeInitialFormValues, createChooseAnimeForm } from '../const';
import { Button as MuiButton } from '@mui/material';
import { H6, ErrorText } from '@/components';
import { useMembersStore, useTitlesStore, useTracksStore } from '@/stores';
import type { ProjectTitle } from '@/stores/useTitlesStore';
import { seasonLabel } from '@/pages/Proposals/const/options';
import { ANIME_TYPE } from '@/types';
import { todayDay } from '@/pages/Projects/const/options';
import { convertAnimeTypeEngToUkr } from '@/utils/convert';
import { trackSeasons } from '../helpers';

interface FormProps {
  saveFormValues: (values: ChooseAnimeFormValues) => void;
  initialValues: ChooseAnimeFormValues | null;
}

const filterTitles = createFilterOptions<ProjectTitle>({
  stringify: ({ ukrName, romajiName, codeName }) =>
    [ukrName, romajiName, codeName].filter(Boolean).join(' '),
});

export const ChooseAnimeForm: FC<FormProps> = ({ saveFormValues, initialValues }) => {
  const getMembers = useMembersStore((state) => state.getMembers);
  const titles = useTitlesStore((state) => state.titles);
  const { resetLastTracks, getLastTracks, lastTracks } = useTracksStore();

  useEffect(() => {
    getMembers();
  }, []);

  const methods = useForm<ChooseAnimeFormValues>({
    defaultValues: initialValues ? initialValues : chooseAnimeInitialFormValues,
    resolver: zodResolver(createChooseAnimeForm()),
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

  const watchProjectId = watch('projectId');
  const watchAnimeType = watch('animeType');
  const watchSeason = watch('season');
  const watchYear = watch('year');
  const watchEpisode = watch('episode');

  const project = titles.find(({ _id }) => _id === watchProjectId);
  const seasons = project ? trackSeasons(project, todayDay()) : [];

  // The previous episode, for the team and the subtitles-only mark
  useEffect(() => {
    const numberEpisode = Number(watchEpisode);

    if (watchProjectId && numberEpisode > 1) {
      getLastTracks({ projectId: watchProjectId, episode: numberEpisode });
    } else {
      resetLastTracks();
    }
  }, [watchProjectId, watchEpisode]);

  useEffect(() => {
    if (!watchProjectId) return;

    setValue('isSubsOnly', !!lastTracks[0]?.isSubsOnly);
  }, [lastTracks.length, watchProjectId]);

  useEffect(() => {
    if (watchAnimeType === ANIME_TYPE.FILM || watchAnimeType === ANIME_TYPE.SHORT_FILM) {
      resetField('episode');
    }

    if (watchAnimeType !== ANIME_TYPE.SHORT_FILM) resetField('duration');
  }, [watchAnimeType]);

  // The type of a title is the one of its project, and the season it is offered is the one the project started in
  const handleProject = (title: ProjectTitle | null) => {
    // The tracks of the previous project must not decide the team or the subtitles mark of this one
    resetLastTracks();

    if (!title) {
      reset(chooseAnimeInitialFormValues);
      return;
    }

    setValue('projectId', title._id, { shouldValidate: true });
    setValue('titleName', title.ukrName, { shouldValidate: true });
    setValue('animeType', title.titleType, { shouldValidate: true });
    setValue('season', title.season, { shouldValidate: true });
    setValue('year', String(title.year), { shouldValidate: true });
  };

  const handleTextInputChange = (
    value: string,
    currentField:
      | ControllerRenderProps<ChooseAnimeFormValues, 'episode'>
      | ControllerRenderProps<ChooseAnimeFormValues, 'duration'>,
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
      <form onSubmit={handleSubmit(onSubmitForm)} style={{ width: '100%' }}>
        <DialogFormWrapper>
          <H6>Тайтл та номер епізоду:</H6>

          <div>
            <FlexRow>
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Autocomplete
                    options={titles}
                    filterOptions={filterTitles}
                    groupBy={({ isFinished }) => (isFinished ? 'Завершені' : 'Триває')}
                    getOptionLabel={(option) => option.ukrName}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    value={titles.find(({ _id }) => _id === field.value) ?? null}
                    onChange={(_, title) => handleProject(title)}
                    noOptionsText="Такого проєкту немає. Створіть його на сторінці «Крихти»"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Проєкт"
                        placeholder="Оберіть проєкт"
                        variant="outlined"
                      />
                    )}
                    renderOption={({ key, ...props }, option) => (
                      <li key={key} {...props}>
                        <div>
                          <div>{option.ukrName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {option.romajiName}
                          </div>
                        </div>
                      </li>
                    )}
                    sx={{ minWidth: '85%', maxWidth: '95%' }}
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
                      !watchProjectId
                    }
                    type="text"
                    onChange={(e) => {
                      handleTextInputChange(e.target.value, field);
                    }}
                  />
                )}
              />
            </FlexRow>

            <FlexColumn>
              <ErrorMessage
                errors={errors}
                name="projectId"
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
              <ErrorMessage
                name="episode"
                errors={errors}
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
            </FlexColumn>

            {project && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {convertAnimeTypeEngToUkr(watchAnimeType as ANIME_TYPE)}
                </Typography>

                <TextField
                  select
                  fullWidth
                  label="У якому сезоні зроблено"
                  value={`${watchSeason}:${watchYear}`}
                  onChange={(event) => {
                    const [season, year] = event.target.value.split(':');

                    setValue('season', season, { shouldValidate: true });
                    setValue('year', year, { shouldValidate: true });
                  }}
                  helperText="Пропонується сезон початку проєкту, крихти підуть у вибраний"
                  sx={{ mt: 2 }}
                >
                  {seasons.map(({ season, year }) => (
                    <MenuItem key={`${season}:${year}`} value={`${season}:${year}`}>
                      {seasonLabel(season, year)}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}

            <FormControlLabel
              label="Тільки субтитри"
              control={
                <Controller
                  name="isSubsOnly"
                  control={control}
                  render={({ field: { value, ...field } }) => (
                    <Checkbox {...field} checked={!!value} />
                  )}
                />
              }
            />
          </div>

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

          <MuiButton type="submit" variant="contained" fullWidth>
            Далі
          </MuiButton>
        </DialogFormWrapper>
      </form>
    </FormProvider>
  );
};
