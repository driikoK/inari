import { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { Box, IconButton, InputAdornment, MenuItem, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import { INCOME_SOURCE } from '@/types';
import type { IncomeFormValues } from '../const/form';
import { incomeSourceOptions } from '../const/options';
import { NicknameField } from './NicknameField';
import { type ProjectOption, TitleField } from './TitleField';

interface IncomeLineFieldsProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  projectOptions: ProjectOption[];
  nicknames: string[];
}

export const IncomeLineFields: FC<IncomeLineFieldsProps> = ({
  index,
  canRemove,
  onRemove,
  projectOptions,
  nicknames,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<IncomeFormValues>();

  const source = watch(`lines.${index}.source`);

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
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <Controller
            control={control}
            name={`lines.${index}.source`}
            render={({ field }) => (
              <TextField {...field} select label="Джерело" fullWidth>
                {incomeSourceOptions.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <ErrorMessage
            name={`lines.${index}.source`}
            errors={errors}
            render={({ message }) => <ErrorText>{message}</ErrorText>}
          />
        </div>

        <div style={{ flex: '1 1 160px' }}>
          <Controller
            control={control}
            name={`lines.${index}.amount`}
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
            name={`lines.${index}.amount`}
            errors={errors}
            render={({ message }) => <ErrorText>{message}</ErrorText>}
          />
        </div>

        {canRemove && (
          <IconButton aria-label="Прибрати надходження" onClick={onRemove} sx={{ mt: 1 }}>
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      {source === INCOME_SOURCE.ORDER && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          10% суми піде в загальну банку, решта — у «Тістечка замовлень» цього тайтлу.
        </div>
      )}

      {(source === INCOME_SOURCE.ORDER || source === INCOME_SOURCE.PROJECT_JAR) && (
        <TitleField
          index={index}
          isRequired={source === INCOME_SOURCE.ORDER}
          projectOptions={projectOptions}
        />
      )}

      {source === INCOME_SOURCE.LISODAR && <NicknameField index={index} nicknames={nicknames} />}
    </Box>
  );
};
