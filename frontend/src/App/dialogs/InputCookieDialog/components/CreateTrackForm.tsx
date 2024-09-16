import { FC, useEffect, useMemo, useState } from 'react';

import { Box, Button, Checkbox, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import toast from 'react-hot-toast';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { FormField } from './FormField';
import { createTrackFormSchema, initialFormValues } from '../const';
import {
  ANIME_TYPE,
  CreateTrackFormValues,
  CreateTrackType,
  FieldFormValue,
  MemberInfo,
} from '../types';
import { CheckboxWrapper, ColorText, SubParagraph, Title, TitleWrapper } from '../styles';
import useUsersStore from '@/stores/useUsersStore';
import useCoinsStore from '@/stores/useCoinsStore';
import useTracksStore from '@/stores/useTracksStore';
import { CoinsType } from '@/types';

interface CreateTrackFormProps {
  titleName: string;
  currentEpisode: string;
  onBack: () => void;
  onClose: () => void;
  animeType: ANIME_TYPE;
}

const startNameForMemberField = 'membersInfo';

export const CreateTrackForm: FC<CreateTrackFormProps> = ({
  titleName,
  currentEpisode,
  onBack,
  onClose,
  animeType,
}) => {
  const { getUsers } = useUsersStore();
  const { coinsTypes } = useCoinsStore();
  const { addTracks } = useTracksStore();

  const [coins, setCoins] = useState<CoinsType>(coinsTypes[animeType as keyof typeof coinsTypes]);

  useEffect(() => {
    getUsers();
  }, []);

  const defaultValues: CreateTrackFormValues = useMemo(() => {
    return {
      ...initialFormValues,
      membersInfo: Object.entries(initialFormValues.membersInfo).reduce((acc, [key, value]) => {
        // ** Values like 'dubs' or 'releasers' where don't need to change default coins value. Coins = 0 by default
        if (Array.isArray(value)) {
          (acc[key as keyof CreateTrackFormValues['membersInfo']] as FieldFormValue[]) = [...value];

          return acc;
        }

        // ** Optional roles. For them also don't need to change default coins value. Coins = 0 by default
        // if (key === 'editor' || key === 'another') {
        //   acc[key] = {
        //     ...value,
        //   };

        //   return acc;
        // }

        // ** Main roles with coins value from endpoint
        (acc[key as keyof CreateTrackFormValues['membersInfo']] as FieldFormValue) = {
          ...value,
          coins: coins[key as keyof typeof coins].toString(),
        } as FieldFormValue;

        return acc;
      }, {} as CreateTrackFormValues['membersInfo']),
    };
  }, [coins]);

  const methods = useForm<CreateTrackFormValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(createTrackFormSchema),
  });

  const {
    handleSubmit,
    register,
    watch,
    formState: { isValid },
  } = methods;

  const watchDubs = watch('membersInfo.dubs').length;

  const onSubmitForm = async (form: CreateTrackFormValues) => {
    const payload: CreateTrackType = {
      membersInfo: Object.entries(form.membersInfo).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((member) => ({
            ...member,
            typeRole: key,
            coins: Number(member.coins),
          }));
        }

        return value?.nickname !== ''
          ? { ...value, typeRole: key, coins: Number(value?.coins) }
          : [];
      }) as MemberInfo[],
      isFast: form.isFast,
      isOngoing: form.isOngoing,
      isPriority: form.isPriority,
      isInTime: form.isInTime,
      nameTitle: titleName,
      currentEpisode: parseInt(currentEpisode),
      titleType: animeType,
    };

    try {
      await addTracks(payload);

      onClose();
      toast.success('Успішно');
    } catch (e) {
      toast.error('Помилка');
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
            }}
          >
            <Title>Назад</Title>
          </Button>
          <TitleWrapper>
            <Title>
              Крихти — <ColorText>{coins.coins}</ColorText>
            </Title>
          </TitleWrapper>

          <FormField name={`${startNameForMemberField}.sound`} label="Звукач" isDisabled />
          <FormField name={`${startNameForMemberField}.director`} label="Куратор" isDisabled />
          <FormField name={`${startNameForMemberField}.sub`} label="Перекладач" isDisabled />
          <FormField
            name={`${startNameForMemberField}.editor`}
            label="Редактор (не обов'язково)"
            isDisabled
          />

          <FormField name={`${startNameForMemberField}.fixer`} label="Фіксер" isDisabled />
          <FormField
            name={`${startNameForMemberField}.roleBreaker`}
            label="Розбивач ролей"
            isDisabled
          />

          <FormField
            name={`${startNameForMemberField}.another`}
            label="Додаткова роль (не обов'язкова)"
            isDisabled
          />

          <SubParagraph>
            {watchDubs <= 2
              ? `Доступно ${coins.dub.double} крихт`
              : `Доступно ${coins.dub.multi} крихт`}
          </SubParagraph>
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

          <TextField
            {...register('note')}
            placeholder="Не обов'язкове поле"
            sx={{ width: '100%' }}
            multiline
            rows={4}
          />

          <Box>
            <CheckboxWrapper>
              <Checkbox {...register('isFast')} />
              <SubParagraph>Зроблено швидко</SubParagraph>

              <Checkbox {...register('isOngoing')} />
              <SubParagraph>Онґоїнґ</SubParagraph>
            </CheckboxWrapper>

            <CheckboxWrapper>
              <Checkbox {...register('isPriority')} />
              <SubParagraph>Пріоритет</SubParagraph>

              <Checkbox {...register('isInTime')} />
              <SubParagraph>Зроблено вчасно</SubParagraph>
            </CheckboxWrapper>
          </Box>

          <Button variant="contained" type="submit" disabled={!isValid}>
            Зберегти
          </Button>
        </Box>
      </form>
    </FormProvider>
  );
};