import { FC, useEffect, useMemo, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { FormField } from './FormField';
import { CoinsCalculator } from './CoinsCalculator';
import { createTrackFormSchema, initialFormValues } from '../const/form';
import { CreateTrackFormValues, CreateTrackType, FieldFormValue, MemberInfo } from '../types';
import { CheckboxWrapper, Paragraph, SubParagraph, Title, TitleWrapper } from '../styles';
import useMembersStore from '@/stores/useMembersStore';
import useCoinsStore from '@/stores/useCoinsStore';
import useTracksStore from '@/stores/useTracksStore';
import { CoinsType, ANIME_TYPE } from '@/types';
import useAuthStore from '@/stores/useAuthStore';

interface CreateTrackFormProps {
  titleName: string;
  episode: string;
  onBack: () => void;
  onClose: () => void;
  animeType: ANIME_TYPE;
  season: string;
  year: string;
  duration?: number;
}

const startNameForMemberField = 'membersInfo';
// ** If exceed then counts as series
const maxDurationForShortFilm = 13;

export const CreateTrackForm: FC<CreateTrackFormProps> = ({
  titleName,
  episode,
  onBack,
  onClose,
  animeType,
  season,
  year,
  duration = 1,
}) => {
  const { getMembers } = useMembersStore();
  const { coinsTypes } = useCoinsStore();
  const { addTracks } = useTracksStore();
  const { user } = useAuthStore();

  const [coins, setCoins] = useState<CoinsType>(
    coinsTypes[
      duration > maxDurationForShortFilm ? 'series' : (animeType as keyof typeof coinsTypes)
    ]
  );

  useEffect(() => {
    getMembers();
  }, []);

  const isOnlyOneEpisode = animeType === ANIME_TYPE.SHORT_FILM || animeType === ANIME_TYPE.FILM;

  const defaultValues: CreateTrackFormValues = useMemo(() => {
    return {
      ...initialFormValues,
      membersInfo: Object.entries(initialFormValues.membersInfo).reduce((acc, [key, value]) => {
        // ** Values like 'dubs' or 'releasers' where don't need to change default coins value. Coins = 0 by default
        if (Array.isArray(value)) {
          (acc[key as keyof CreateTrackFormValues['membersInfo']] as FieldFormValue[]) = [...value];

          return acc;
        }

        // ** Main roles with coins value from endpoint
        (acc[key as keyof CreateTrackFormValues['membersInfo']] as FieldFormValue) = {
          ...value,
          coins: coins[key as keyof typeof coins].toString(),
        } as FieldFormValue;

        return acc;
      }, {} as CreateTrackFormValues['membersInfo']),
      isLastEpisode: isOnlyOneEpisode,
    };
  }, [coins]);

  const methods = useForm<CreateTrackFormValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(createTrackFormSchema(coins)),
    criteriaMode: 'all',
    mode: 'onChange',
  });

  const { handleSubmit, register, watch, resetField, control } = methods;

  /* Triggers full form re-render when any field in 'membersInfo.dubs' changes.
     Maybe should remove this watch and then remove dynamic value of coins */
  const watchDubs = watch('membersInfo.dubs').length;

  const watchEditor = watch('membersInfo.editor.nickname');
  const watchTypesetter = watch('membersInfo.typesetter.nickname');

  const watchIsGiveEditorCoins = watch('isGiveEditorCoins');
  const watchIsGiveTypesetterCoins = watch('isGiveTypesetterCoins');
  const watchIsLastEpisode = watch('isLastEpisode');

  useEffect(() => {
    if (watchEditor) resetField('isGiveEditorCoins');
  }, [watchEditor]);
  useEffect(() => {
    if (watchTypesetter) resetField('isGiveTypesetterCoins');
  }, [watchTypesetter]);

  useEffect(() => {
    if (watchIsGiveEditorCoins) resetField('membersInfo.editor.nickname');
  }, [watchIsGiveEditorCoins]);
  useEffect(() => {
    if (watchIsGiveTypesetterCoins) resetField('membersInfo.typesetter.nickname');
  }, [watchIsGiveTypesetterCoins]);

  const onSubmitForm = async (form: CreateTrackFormValues) => {
    delete form.isLastEpisode;

    const payload: CreateTrackType = {
      ...form,
      membersInfo: Object.entries(form.membersInfo).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((member) => ({
            ...member,
            typeRole: key,
            coins: Number(member.coins),
          }));
        }

        if (!value?.hasOwnProperty('nickname')) return [];

        return value?.nickname !== ''
          ? { ...value, typeRole: key, coins: Number(value?.coins) }
          : [];
      }) as MemberInfo[],
      nameTitle: titleName,
      currentEpisode: parseInt(episode),
      titleType: animeType,
      season,
      year: Number(year),
      note: form.note || '',
      username: user!.username,
    };

    try {
      await addTracks(payload);

      onClose();
      toast.success('Успішно додано');
    } catch (e) {
      toast.error('Виникла помилка');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{
              color: 'black',
              fontSize: '16px',
              alignSelf: 'flex-start',
              textTransform: 'none',
            }}
          >
            Назад
          </Button>
          <TitleWrapper>
            <Title>{titleName}</Title>
          </TitleWrapper>

          <FormField name={`${startNameForMemberField}.sound`} label="Звукач" isDisabled />
          <FormField name={`${startNameForMemberField}.director`} label="Куратор" isDisabled />
          <FormField name={`${startNameForMemberField}.sub`} label="Перекладач" isDisabled />
          <FormField name={`${startNameForMemberField}.fixer`} label="Фіксер" isDisabled />

          <div>
            <FormField
              name={`${startNameForMemberField}.editor`}
              label="Редактор (не обов'язково)"
              isDisabled
            />

            <FormControlLabel
              label="Віддати перекладачу"
              control={
                <Controller
                  name="isGiveEditorCoins"
                  control={control}
                  render={({ field: { value, ...field } }) => (
                    <Checkbox {...field} checked={!!value} />
                  )}
                />
              }
            />
          </div>

          <div>
            <FormField
              name={`${startNameForMemberField}.typesetter`}
              label="Тайпсеттер (не обов'язкова)"
              isDisabled
            />

            <FormControlLabel
              label="Віддати перекладачу"
              control={
                <Controller
                  name="isGiveTypesetterCoins"
                  control={control}
                  render={({ field: { value, ...field } }) => (
                    <Checkbox {...field} checked={!!value} />
                  )}
                />
              }
            />
          </div>

          <SubParagraph>
            {watchDubs <= 2
              ? `Доступно ${coins.dub.double} крихт`
              : `Доступно ${coins.dub.multi} крихт`}
          </SubParagraph>

          <CoinsCalculator coinsForDubs={watchDubs <= 2 ? coins.dub.double : coins.dub.multi} />
          <FormField
            name={`${startNameForMemberField}.dubs`}
            label="Дабери"
            isArray
            maxLength={10}
          />

          <SubParagraph>{`Доступно ${coins.releaser} крихт`}</SubParagraph>
          <FormField
            name={`${startNameForMemberField}.releasers`}
            label="Релізери"
            isArray
            maxLength={2}
          />

          <FormControlLabel
            label="Останній епізод"
            control={
              <Controller
                name="isLastEpisode"
                control={control}
                render={({ field: { value, ...field } }) => (
                  <Checkbox {...field} checked={!!value} disabled={isOnlyOneEpisode} />
                )}
              />
            }
          />

          {watchIsLastEpisode && (
            <FormField
              name={`${startNameForMemberField}.roleBreaker`}
              label="Розбивач ролей"
              isDisabled
            />
          )}

          <Paragraph style={{ alignSelf: 'flex-start' }}>Нотатка:</Paragraph>
          <TextField
            {...register('note')}
            placeholder="Не обов'язкове поле"
            sx={{ width: '100%' }}
            multiline
            rows={4}
          />

          <Box>
            <CheckboxWrapper>
              <Checkbox {...register('isOngoing')} />
              <SubParagraph>Онґоїнґ</SubParagraph>

              <Checkbox {...register('isPriority')} />
              <SubParagraph>Пріоритет</SubParagraph>

              <Checkbox {...register('isInTime')} />
              <SubParagraph>Зроблено вчасно</SubParagraph>
            </CheckboxWrapper>
          </Box>

          <Button variant="contained" type="submit">
            Зберегти
          </Button>
        </Box>
      </form>
    </FormProvider>
  );
};
