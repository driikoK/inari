import { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';

import { DateInput, ErrorText } from '@/components';
import { MIN_DAY, todayDay } from '@/pages/Projects/const/options';

interface DateFieldProps {
  maxWidth?: number;
}

// The date of a record: not before 2000 and not in the future, the same as the form schema says
export const DateField: FC<DateFieldProps> = ({ maxWidth }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<{ date: string }>();

  return (
    <div>
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <DateInput
            {...field}
            label="Дата"
            fullWidth
            sx={maxWidth ? { maxWidth } : undefined}
            min={MIN_DAY}
            max={todayDay()}
          />
        )}
      />
      <ErrorMessage
        name="date"
        errors={errors}
        render={({ message }) => <ErrorText>{message}</ErrorText>}
      />
    </div>
  );
};
