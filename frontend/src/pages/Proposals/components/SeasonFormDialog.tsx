import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { Box, Button, MenuItem, TextField } from '@mui/material';

import { CustomDialog, ErrorText, H6 } from '@/components';
import useProposalsStore, { notifyFailure } from '@/stores/useProposalsStore';
import { seasonOptions } from '@/utils/constants';
import { createSeasonFormSchema, type SeasonFormValues } from '../const/form';
import { nextSeason, yearChoices } from '../const/options';

interface SeasonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (seasonKey: string) => void;
}

export const SeasonFormDialog: FC<SeasonFormDialogProps> = ({ open, onClose, onCreated }) => {
  const createSeason = useProposalsStore((state) => state.createSeason);
  const upcoming = nextSeason();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeasonFormValues>({
    defaultValues: { season: upcoming.season, year: String(upcoming.year) },
    resolver: zodResolver(createSeasonFormSchema()),
    mode: 'onChange',
  });

  const onSubmit = async ({ season, year }: SeasonFormValues) => {
    try {
      await createSeason(season, Number(year));
      toast.success('Сезон додано');
      onCreated(`${season}-${year}`);
      onClose();
    } catch (error) {
      notifyFailure(error);
    }
  };

  return (
    <CustomDialog open={open} onClose={onClose}>
      <H6>Новий сезон</H6>

      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div>
            <Controller
              control={control}
              name="season"
              render={({ field }) => (
                <TextField {...field} select label="Сезон" fullWidth>
                  {seasonOptions.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <ErrorMessage
              name="season"
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>

          <div>
            <Controller
              control={control}
              name="year"
              render={({ field }) => (
                <TextField {...field} select label="Рік" fullWidth>
                  {yearChoices().map((year) => (
                    <MenuItem key={year} value={String(year)}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <ErrorMessage
              name="year"
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>

          <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
            Додати сезон
          </Button>
        </Box>
      </form>
    </CustomDialog>
  );
};
