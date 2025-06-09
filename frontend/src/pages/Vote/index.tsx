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
import { AlertDialog } from '@/components/AlertDialog';

const Vote: FC = () => {
  const { getAnime, animes, isLoading } = usePollStore();
  const { hasAccess } = usePermissions();

  const [loadingButton, setLoadingButton] = useState(false);
  const [isShowAddPollAnime, setIsShowAddPollAnime] = useState(false);
  const [isShowClearPollDialog, setIsShowClearPollDialog] = useState(false);

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

  const handleClearAnimesAndResults = async () => {
    try {
      await axios.post(`/polls/clear-poll`);
      getAnime();
      toast.success('Аніме та результати видалено');
    } catch (error) {
    } finally {
      setIsShowClearPollDialog(false);
    }
  };

  const isAnimesExist = animes?.ongoings.length !== 0 || animes?.olds.length !== 0;

  return (
    <PageWrapper>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {hasAccess(SUBJECTS.ADD_POLL_ANIME) && (
          <Button variant="contained" onClick={() => setIsShowAddPollAnime(true)} sx={{ mb: 2 }}>
            Додати для голосування
          </Button>
        )}

        {hasAccess(SUBJECTS.CLEAR_RESULTS) && isAnimesExist && (
          <Button
            variant="contained"
            color="error"
            onClick={() => setIsShowClearPollDialog(true)}
            sx={{ mb: 2 }}
          >
            Видалити аніме та результати
          </Button>
        )}
      </Box>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {animes?.ongoings.length !== 0 && (
              <PollSection
                animes={animes?.ongoings}
                sectionTitle="Онґоїнґи"
                isLoading={isLoading}
              />
            )}

            {animes?.olds.length !== 0 && (
              <PollSection
                animes={animes?.olds}
                sectionTitle="Старі тайтли"
                isLoading={isLoading}
              />
            )}
          </Box>

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

      {isShowClearPollDialog && (
        <AlertDialog
          open={isShowClearPollDialog}
          onClose={() => setIsShowClearPollDialog(false)}
          onConfirm={handleClearAnimesAndResults}
          title="Видалити аніме та результати голосування?"
          text="Усі аніме та результати голосування будуть видалені."
        />
      )}
    </PageWrapper>
  );
};

export default Vote;
