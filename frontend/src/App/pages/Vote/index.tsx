import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { ErrorMessage } from '@hookform/error-message';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';

import axios from '@/api';
import { ErrorText } from '@/components';
import usePollStore from '@/stores/usePollStore';
import PollSection from './PollSection';
import { PageWrapper, SubmitButton } from './styles';
import AddPollAnimeDialog from '@/App/dialogs/AddPollAnimeDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { SUBJECTS } from '@/context/casl';

const createChooseAnimeForm = () =>
  Yup.object().shape({
    animeIds: Yup.array()
      .of(Yup.string().required())
      .min(1, 'Виберіть хоча б один тайтл')
      .required('Це поле обов’язкове'),
  });

const chooseAnimeInitialFormValues = {
  animeIds: [],
};

export interface ChosenAnimes {
  animeIds: string[];
}

const Vote: FC = () => {
  const { getAnime, animes, isLoading } = usePollStore();
  const { hasAccess } = usePermissions();

  const [loadingButton, setLoadingButton] = useState(false);
  const [isShowAddPollAnime, setIsShowAddPollAnime] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChosenAnimes>({
    defaultValues: chooseAnimeInitialFormValues,
    resolver: yupResolver(createChooseAnimeForm()),
    mode: 'onChange',
  });

  useEffect(() => {
    getAnime();
  }, []);

  const onSubmit = async (formData: ChosenAnimes) => {
    setLoadingButton(true);

    try {
      const requestBody = {
        animeIds: formData.animeIds,
      };

      await axios.post(`/polls/vote`, requestBody);

      toast.success('Дякую за участь 🥰');
    } catch (error) {
    } finally {
      setLoadingButton(false);
    }
  };

  return (
    <PageWrapper>
      {hasAccess(SUBJECTS.ADD_POLL_ANIME) && (
        <Button variant="contained" onClick={() => setIsShowAddPollAnime(true)} sx={{ mb: 2 }}>
          Додати для голосування
        </Button>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <ErrorMessage
          errors={errors}
          name="animeIds"
          render={({ message }) => <ErrorText>{message}</ErrorText>}
        />

        <PollSection
          control={control}
          animes={animes?.ongoings}
          sectionTitle="Онґоїнґи"
          isLoading={isLoading}
        />

        <PollSection
          control={control}
          animes={animes?.olds}
          sectionTitle="Старі тайтли"
          isLoading={isLoading}
        />

        {animes?.ongoings.length !== 0 || animes?.olds.length !== 0 ? (
          <SubmitButton variant="contained" type="submit">
            {loadingButton ? 'Завантаження...' : 'Проголосувати'}
          </SubmitButton>
        ) : null}
      </form>

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
