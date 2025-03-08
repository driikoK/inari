import { FC, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';

import { usePollStore } from '@/stores';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';
import { AddPollAnimeDialog, PollSection } from '@/pages/Vote/components';
import { PageWrapper, SubmitButton } from './styles';
import { ChooseAnimeFormValues } from './types';
import { chooseAnimeInitialFormValues, createChooseAnimeForm } from './const/form';
import axios from '@/api';

const Vote: FC = () => {
  const { getAnime, animes, isLoading } = usePollStore();
  const { hasAccess } = usePermissions();

  const [loadingButton, setLoadingButton] = useState(false);
  const [isShowAddPollAnime, setIsShowAddPollAnime] = useState(false);

  const methods = useForm<ChooseAnimeFormValues>({
    defaultValues: chooseAnimeInitialFormValues,
    resolver: yupResolver(createChooseAnimeForm()),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  useEffect(() => {
    getAnime();
  }, []);

  useEffect(() => {
    if (errors.chosenAnimes) toast.error('Виберіть хоча б один тайтл');
  }, [errors.chosenAnimes]);

  const onSubmit = async (formData: ChooseAnimeFormValues) => {
    setLoadingButton(true);

    try {
      const requestBody = {
        votes: formData.chosenAnimes,
      };

      await axios.post(`/polls/vote`, requestBody);

      toast.success('Дякуємо за участь 🥰');
    } catch (error) {
    } finally {
      setLoadingButton(false);
    }
  };

  const isAnimesExist = animes?.ongoings.length !== 0 || animes?.olds.length !== 0;

  return (
    <PageWrapper>
      {hasAccess(SUBJECTS.ADD_POLL_ANIME) && (
        <Button variant="contained" onClick={() => setIsShowAddPollAnime(true)} sx={{ mb: 2 }}>
          Додати для голосування
        </Button>
      )}

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {animes?.ongoings.length !== 0 && (
            <PollSection animes={animes?.ongoings} sectionTitle="Онґоїнґи" isLoading={isLoading} />
          )}

          {animes?.olds.length !== 0 && (
            <Box sx={{ mt: 20 }}>
              <PollSection
                animes={animes?.olds}
                sectionTitle="Старі тайтли"
                isLoading={isLoading}
              />
            </Box>
          )}

          {isAnimesExist ? (
            <SubmitButton variant="contained" type="submit">
              {loadingButton ? 'Завантаження...' : 'Проголосувати'}
            </SubmitButton>
          ) : null}
        </form>
      </FormProvider>

      {isShowAddPollAnime && (
        <AddPollAnimeDialog
          open={isShowAddPollAnime}
          onClose={() => setIsShowAddPollAnime(false)}
        />
      )}
    </PageWrapper>
  );
};

export default Vote;
