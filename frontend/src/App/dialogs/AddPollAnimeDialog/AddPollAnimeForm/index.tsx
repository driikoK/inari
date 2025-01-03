import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { yupResolver } from '@hookform/resolvers/yup';
import { ErrorMessage } from '@hookform/error-message';
import { Checkbox, FormControlLabel, TextField } from '@mui/material';

import { createPollAnimeSchema, initialFormValues } from '../const/form';
import { DialogWrapper } from '../../InputCookieDialog/styles';
import { ErrorText, H6, Button } from '@/components';
import usePollStore, { NewPollAnime } from '@/stores/usePollStore';

const textFields = [
  {
    fieldName: 'name',
    title: 'Назва',
  },
  {
    fieldName: 'link',
    title: 'Посилання',
  },
  {
    fieldName: 'posterUrl',
    title: 'Посилання на постер',
  },
];

const checkboxFields = [
  {
    fieldName: 'isOngoing',
    title: 'Онґоїнґ',
  },
  {
    fieldName: 'isPriority',
    title: 'Пріоритет',
  },
  {
    fieldName: 'isDecided',
    title: 'Обрано',
  },
  {
    fieldName: 'isSponsored',
    title: 'Від спонсорів',
  },
];

export const AddPollAnimeForm = ({ onClose }: { onClose: () => void }) => {
  const { addAnime } = usePollStore();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<NewPollAnime>({
    defaultValues: initialFormValues,
    resolver: yupResolver(createPollAnimeSchema()),
    mode: 'onChange',
  });

  const onSubmitForm = async (form: NewPollAnime) => {
    try {
      await addAnime(form);
      toast.success('Аніме успішно додано!');

      onClose();
    } catch (error) {}
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <DialogWrapper>
        {textFields.map(({ fieldName, title }) => (
          <div key={fieldName}>
            <H6>{title}:</H6>

            <Controller
              control={control}
              name={fieldName as keyof NewPollAnime}
              render={({ field }) => (
                <TextField
                  value={field.value}
                  type="text"
                  placeholder={title}
                  onChange={field.onChange}
                  sx={{ width: '100%' }}
                />
              )}
            />

            <ErrorMessage
              name={fieldName as keyof NewPollAnime}
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>
        ))}

        <div>
          {checkboxFields.map(({ fieldName, title }) => (
            <FormControlLabel
              key={fieldName}
              label={title}
              control={<Checkbox {...register(fieldName as keyof NewPollAnime)} />}
            />
          ))}
        </div>

        <Button type="submit" color="inherit">
          Створити
        </Button>
      </DialogWrapper>
    </form>
  );
};
