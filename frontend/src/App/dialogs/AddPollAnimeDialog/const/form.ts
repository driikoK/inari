import * as Yup from 'yup';

import { NewPollAnime } from '@/stores/usePollStore';

export const createPollAnimeSchema = () => {
  return Yup.object().shape({
    name: Yup.string().required('Обов’язкове поле'),
    link: Yup.string().url('Введіть коректне посилання').required('Обов’язкове поле'),
    posterUrl: Yup.string().url('Введіть коректне посилання').required('Обов’язкове поле'),
    isOngoing: Yup.boolean().required(),
    isPriority: Yup.boolean().required(),
    isDecided: Yup.boolean().required(),
    isSponsored: Yup.boolean().required(),
  });
};

export const initialFormValues: NewPollAnime = {
  name: '',
  link: '',
  posterUrl: '',
  isOngoing: false,
  isPriority: false,
  isSponsored: false,
  isDecided: false,
};
