import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { Box, Button, Checkbox, FormControlLabel } from '@mui/material';

import { CustomDialog, DateInput, ErrorText, H6, P } from '@/components';
import useProjectsStore, { type ProjectView } from '@/stores/useProjectsStore';
import { notifyFailure } from '@/utils/request';
import { createFinishFormSchema, type FinishFormValues } from '../const/form';
import { todayDay } from '../const/options';

interface FinishProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectView;
}

export const FinishProjectDialog: FC<FinishProjectDialogProps> = ({ open, onClose, project }) => {
  const finishProject = useProjectsStore((state) => state.finishProject);
  const today = todayDay();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FinishFormValues>({
    defaultValues: { endDate: today, isInTime: false },
    resolver: zodResolver(createFinishFormSchema(project.startDate, today)),
    mode: 'onChange',
  });

  const onSubmit = async (values: FinishFormValues) => {
    try {
      await finishProject(project._id, values);
      toast.success('Проєкт завершено');
      onClose();
    } catch (error) {
      notifyFailure(error);
    }
  };

  return (
    <CustomDialog open={open} onClose={onClose}>
      <H6>Завершити проєкт</H6>
      <P sx={{ color: 'var(--text-muted)' }}>{project.ukrName}</P>

      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <DateInput
                  {...field}
                  label="Дата фіналу"
                  min={project.startDate}
                  max={today}
                  fullWidth
                />
              )}
            />
            <ErrorMessage
              name="endDate"
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>

          <Controller
            control={control}
            name="isInTime"
            render={({ field }) => (
              <FormControlLabel
                label="Завершено вчасно"
                control={<Checkbox checked={field.value} onChange={field.onChange} />}
              />
            )}
          />

          <P sx={{ color: 'var(--text-muted)' }}>
            Позначте, якщо проєкт закрито на початку нового сезону, але борг йому не рахувати.
          </P>

          <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
            Завершено
          </Button>
        </Box>
      </form>
    </CustomDialog>
  );
};
