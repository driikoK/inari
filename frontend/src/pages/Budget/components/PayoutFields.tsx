import { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';
import { Autocomplete, Box, InputAdornment, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import { EXPENSE_KIND } from '@/types';
import type { BudgetPlace, PayoutValues, TreatFormValues } from '../const/expenseForm';
import { expenseKindOptions, formatKop } from '../const/options';

interface PayoutFieldsProps {
  kind: EXPENSE_KIND;
  places: BudgetPlace[];
  nicknames: string[];
}

const REQUISITE_LABEL: Record<EXPENSE_KIND, string> = {
  [EXPENSE_KIND.CARD]: 'Номер карти',
  [EXPENSE_KIND.DONATION]: 'Номер карти або посилання на банку',
  [EXPENSE_KIND.DEVELOPMENT]: '',
};

export const PayoutFields: FC<PayoutFieldsProps> = ({ kind, places, nicknames }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<TreatFormValues>();

  const name = (field: keyof PayoutValues) => `${kind}.${field}` as const;
  const title = expenseKindOptions.find(({ value }) => value === kind)?.label;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <Controller
            control={control}
            name={name('amount')}
            render={({ field }) => (
              <TextField
                {...field}
                label="Сума"
                fullWidth
                slotProps={{
                  htmlInput: { inputMode: 'decimal' },
                  input: { endAdornment: <InputAdornment position="end">грн</InputAdornment> },
                }}
              />
            )}
          />
          <ErrorMessage
            name={name('amount')}
            errors={errors}
            render={({ message }) => <ErrorText>{message}</ErrorText>}
          />
        </div>

        {kind !== EXPENSE_KIND.DEVELOPMENT && (
          <div style={{ flex: '2 1 240px' }}>
            <Controller
              control={control}
              name={name('requisite')}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={REQUISITE_LABEL[kind]}
                  fullWidth
                  slotProps={{ htmlInput: { autoComplete: 'off' } }}
                />
              )}
            />
            <ErrorMessage
              name={name('requisite')}
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>
        )}
      </Box>

      <div>
        <Controller
          control={control}
          name={name('nickname')}
          render={({ field }) => (
            <Autocomplete
              freeSolo
              options={nicknames}
              value={field.value || null}
              onChange={(_, value) => field.onChange(value ?? '')}
              inputValue={field.value}
              onInputChange={(_, value) => field.onChange(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ім’я учасника"
                  helperText="Оберіть нікнейм або впишіть ім’я"
                />
              )}
            />
          )}
        />
        <ErrorMessage
          name={name('nickname')}
          errors={errors}
          render={({ message }) => <ErrorText>{message}</ErrorText>}
        />
      </div>

      <div>
        <Controller
          control={control}
          name={name('place')}
          render={({ field }) => (
            <Autocomplete<BudgetPlace>
              options={places}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              value={places.find(({ key }) => key === field.value) ?? null}
              onChange={(_, option) => field.onChange(option?.key ?? '')}
              noOptionsText="Бюджетів ще немає"
              renderOption={({ key, ...props }, option) => (
                <li key={key} {...props}>
                  <div>
                    <div>{option.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Залишок {formatKop(option.balanceKop)}
                    </div>
                  </div>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Розділ бюджету"
                  helperText="Звідки йдуть гроші: напрямок підтримки або бюджет тайтлу"
                />
              )}
            />
          )}
        />
        <ErrorMessage
          name={name('place')}
          errors={errors}
          render={({ message }) => <ErrorText>{message}</ErrorText>}
        />
      </div>
    </Box>
  );
};
