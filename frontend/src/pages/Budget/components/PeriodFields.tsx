import { FC, useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';
import { Box, MenuItem, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import { MIN_DAY, todayDay } from '@/pages/Projects/const/options';
import { seasonOptions } from '@/utils/constants';
import { seasonOfDay } from '../const/options';
import { DateField } from './DateField';

export interface PeriodValues {
  date: string;
  season: string;
  year: string;
}

interface PeriodFieldsProps {
  // A record that is edited already has the season it was given
  isManual?: boolean;
  hint: string;
  extraYear?: number;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// The date, and the season the money counts in: prefilled from the date until it is chosen by hand
export const PeriodFields: FC<PeriodFieldsProps> = ({ isManual = false, hint, extraYear }) => {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<PeriodValues>();
  const [isSeasonManual, setIsSeasonManual] = useState(isManual);

  const date = watch('date');

  useEffect(() => {
    if (isSeasonManual || !DAY_PATTERN.test(date)) return;

    const { season, year } = seasonOfDay(date);

    setValue('season', season);
    setValue('year', String(year));
  }, [date, isSeasonManual, setValue]);

  const years = useMemo(() => {
    const first = Number(MIN_DAY.slice(0, 4));
    const last = Number(todayDay().slice(0, 4)) + 1;
    const list = Array.from({ length: last - first + 1 }, (_, step) => first + step);

    return extraYear && !list.includes(extraYear) ? [...list, extraYear] : list;
  }, [extraYear]);

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <DateField />
        </div>

        <div style={{ flex: '1 1 120px' }}>
          <Controller
            control={control}
            name="season"
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Сезон"
                fullWidth
                onChange={(event) => {
                  setIsSeasonManual(true);
                  field.onChange(event);
                }}
              >
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

        <div style={{ flex: '1 1 100px' }}>
          <Controller
            control={control}
            name="year"
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Рік"
                fullWidth
                onChange={(event) => {
                  setIsSeasonManual(true);
                  field.onChange(event);
                }}
              >
                {years.map((year) => (
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
      </Box>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</div>
    </>
  );
};
