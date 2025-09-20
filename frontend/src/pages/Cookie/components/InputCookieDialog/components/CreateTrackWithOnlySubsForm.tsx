import { FC, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Checkbox, FormControlLabel, TextField } from '@mui/material';

import { FormField } from './FormField';
import { createTrackWithSubsOnlyFormSchema, initialSubsOnlyFormValues } from '../const/form';
import {
  CreateTrackWithSubsOnlyFormValues,
  CreateTrackType,
  FieldFormValue,
  BasicTrackProps,
} from '../types';
import { CheckboxWrapper } from '../styles';
import { CoinsType } from '@/types';
import { useAuthStore, useMembersStore, useTracksStore } from '@/stores';
import { Button, H6, P, Subtitle } from '@/components';
import useCoinsCalculation from '../hooks/useCoinsCalculation';
import { startNameForMemberField } from '../const';
import { useCoinsByDuration, useWatchCheckboxValues, useWatchNicknames } from '../hooks';
import { checkIsOnlyOneEpisode, finalizeMembersInfoArray } from '../helpers';

export const CreateTrackWithOnlySubsForm: FC<BasicTrackProps> = ({
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
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    getMembers();
  }, []);

  const isOnlyOneEpisode = checkIsOnlyOneEpisode(animeType);
  const coins = useCoinsByDuration(duration, animeType);

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
    membersInfo: CreateTrackWithSubsOnlyFormValues['membersInfo'],
    coins: CoinsType,
    lastTracks?: { typeRole: string; nickname: string }[]
  ): CreateTrackWithSubsOnlyFormValues['membersInfo'] => {
    return Object.entries(membersInfo).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        (acc[key as keyof CreateTrackWithSubsOnlyFormValues['membersInfo']] as FieldFormValue[]) = [
          ...findTracksByKey(key, value),
        ];
      } else {
        (acc[key as keyof CreateTrackWithSubsOnlyFormValues['membersInfo']] as FieldFormValue) = {
          ...value,
          coins: coins[key as keyof typeof coins].toString(),
          nickname:
            lastTracks?.find((track) => track.typeRole === key)?.nickname || value?.nickname || '',
        };
      }
      return acc;
    }, {} as CreateTrackWithSubsOnlyFormValues['membersInfo']);
  };

  const defaultValues: CreateTrackWithSubsOnlyFormValues = useMemo(() => {
    return {
      ...initialSubsOnlyFormValues,
      membersInfo: transformMembersInfo(initialSubsOnlyFormValues.membersInfo, coins),
      isLastEpisode:
        isOnlyOneEpisode || !!lastTracks?.find((track) => track.typeRole === 'roleBreaker'),
    };
  }, []);

  const methods = useForm<CreateTrackWithSubsOnlyFormValues>({
    defaultValues,
    resolver: yupResolver(createTrackWithSubsOnlyFormSchema(coins)),
    criteriaMode: 'all',
    mode: 'onChange',
  });
  const { handleSubmit, register, watch, reset, control, setValue } = methods;

  // ** To set nicknames from previous episode if exist
  useEffect(() => {
    if (!lastTracks.length) return;

    const updatedValues = {
      ...defaultValues,
      membersInfo: transformMembersInfo(defaultValues.membersInfo, coins, lastTracks),
    };

    reset(updatedValues);
  }, [lastTracks.length]);

  const { coinsForReleasers } = useCoinsCalculation({
    watch,
    defaultCoins: coins,
  });

  useWatchCheckboxValues(watch, setValue);
  useWatchNicknames(watch, setValue);

  const onSubmitForm = async (form: CreateTrackWithSubsOnlyFormValues) => {
    const payload: CreateTrackType = {
      ...form,
      membersInfo: finalizeMembersInfoArray(form.membersInfo),
      nameTitle: titleName,
      currentEpisode: parseInt(episode),
      titleType: animeType,
      season,
      year: Number(year),
      note: form.note || '',
      username: user!.username,
      isSubsOnly: true,
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

          <Subtitle sx={{ textAlign: 'center' }}>{`Доступно ${coinsForReleasers} крихт`}</Subtitle>
          <FormField
            name={`${startNameForMemberField}.releasers`}
            label="Релізери"
            isArray
            maxLength={2}
          />

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
