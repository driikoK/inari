import { FC, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Checkbox, FormControlLabel, TextField } from '@mui/material';

import { FormField } from './FormField';
import { CoinsCalculator } from './CoinsCalculator';
import { createTrackFormSchema, initialFormValues } from '../const/form';
import { CreateTrackFormValues, CreateTrackType, FieldFormValue, MemberInfo } from '../types';
import { CheckboxWrapper } from '../styles';
import { CoinsType, ANIME_TYPE } from '@/types';
import { useAuthStore, useMembersStore, useCoinsStore, useTracksStore } from '@/stores';
import { Button, H6, P, Subtitle } from '@/components';
import useCoinsCalculation from '../useCoinsCalculation';

interface CreateTrackFormProps {
  titleName: string;
  episode: string;
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
  onClose,
  animeType,
  season,
  year,
  duration = 1,
}) => {
  const getMembers = useMembersStore((state) => state.getMembers);
  const { lastTracks, addTracks, resetLastTracks } = useTracksStore();
  const coinsTypes = useCoinsStore((state) => state.coinsTypes);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    getMembers();
  }, []);

  const getCoinsDependsOnDuration = (duration: number, animeType: ANIME_TYPE) => {
    if (animeType === ANIME_TYPE.SHORT_FILM && duration > maxDurationForShortFilm) {
      return coinsTypes.series;
    }

    return coinsTypes[animeType as keyof typeof coinsTypes];
  };

  const isOnlyOneEpisode = animeType === ANIME_TYPE.SHORT_FILM || animeType === ANIME_TYPE.FILM;
  const coins: CoinsType = getCoinsDependsOnDuration(duration, animeType);

  const findTracksByKey = (key: string, defaultValue: FieldFormValue[]) => {
    const arrayValuesFromPrevEpisode = lastTracks
      .filter((track) => track.typeRole === key)
      .map((track) => {
        return {
          nickname: track.nickname,
          coins: '',
        };
      });

    return arrayValuesFromPrevEpisode.length > 0 ? arrayValuesFromPrevEpisode : defaultValue;
  };

  const transformMembersInfo = (
    membersInfo: CreateTrackFormValues['membersInfo'],
    coins: CoinsType,
    lastTracks?: { typeRole: string; nickname: string }[]
  ): CreateTrackFormValues['membersInfo'] => {
    return Object.entries(membersInfo).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        (acc[key as keyof CreateTrackFormValues['membersInfo']] as FieldFormValue[]) = [
          ...findTracksByKey(key, value),
        ];
      } else {
        (acc[key as keyof CreateTrackFormValues['membersInfo']] as FieldFormValue) = {
          ...value,
          coins: coins[key as keyof typeof coins].toString(),
          nickname:
            lastTracks?.find((track) => track.typeRole === key)?.nickname || value?.nickname || '',
        };
      }
      return acc;
    }, {} as CreateTrackFormValues['membersInfo']);
  };

  const defaultValues: CreateTrackFormValues = useMemo(() => {
    return {
      ...initialFormValues,
      membersInfo: transformMembersInfo(initialFormValues.membersInfo, coins),
      isLastEpisode: isOnlyOneEpisode,
    };
  }, []);

  const methods = useForm<CreateTrackFormValues>({
    defaultValues,
    resolver: yupResolver(createTrackFormSchema(coins)),
    criteriaMode: 'all',
    mode: 'onChange',
  });
  const { handleSubmit, register, watch, resetField, reset, control } = methods;

  // ** To set nicknames from previous episode if exist
  useEffect(() => {
    if (!lastTracks.length) return;

    const updatedValues = {
      ...defaultValues,
      membersInfo: transformMembersInfo(defaultValues.membersInfo, coins, lastTracks),
    };

    reset(updatedValues);
  }, [lastTracks.length]);

  const { coinsForDubs, coinsForReleasers, coinsForFixers } = useCoinsCalculation({
    watch,
    defaultCoins: coins,
  });

  const watchDubs = watch('membersInfo.dubs');
  const isDoubleDubs = watchDubs.length <= 2;

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

      resetLastTracks();
      onClose();
      toast.success('Успішно додано');
    } catch (e) {}
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmitForm)} style={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <H6 sx={{ textAlign: 'center' }}>{titleName}</H6>

          <FormField name={`${startNameForMemberField}.sound`} label="Звукач" isDisabled />
          <FormField name={`${startNameForMemberField}.director`} label="Куратор" isDisabled />
          <FormField name={`${startNameForMemberField}.sub`} label="Перекладач" isDisabled />

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

          <Subtitle sx={{ textAlign: 'center' }}>{`Доступно ${coinsForDubs} крихт`}</Subtitle>

          <CoinsCalculator coinsForDubs={isDoubleDubs ? coins.dub.double : coins.dub.multi} />
          <FormField
            name={`${startNameForMemberField}.dubs`}
            label="Дабери"
            isArray
            maxLength={10}
          />

          <Subtitle sx={{ textAlign: 'center' }}>{`Доступно ${coinsForReleasers} крихт`}</Subtitle>
          <FormField
            name={`${startNameForMemberField}.releasers`}
            label="Релізери"
            isArray
            maxLength={2}
          />

          <Subtitle sx={{ textAlign: 'center' }}>{`Доступно ${coinsForFixers} крихт`}</Subtitle>
          <FormField
            name={`${startNameForMemberField}.fixers`}
            label="Фіксери"
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

          <div>
            <P sx={{ alignSelf: 'flex-start' }}>Нотатка:</P>
            <TextField
              {...register('note')}
              placeholder="Не обов'язкове поле"
              sx={{ width: '100%' }}
              multiline
              rows={4}
            />
          </div>

          <Box>
            <CheckboxWrapper>
              <FormControlLabel label="Онґоїнґ" control={<Checkbox {...register(`isOngoing`)} />} />
              <FormControlLabel
                label="Пріоритет"
                control={<Checkbox {...register('isPriority')} />}
              />
              <FormControlLabel
                label="Зроблено вчасно"
                control={<Checkbox {...register(`isInTime`)} />}
              />
            </CheckboxWrapper>
          </Box>

          <Button type="submit" color="inherit">
            Зберегти
          </Button>
        </Box>
      </form>
    </FormProvider>
  );
};
