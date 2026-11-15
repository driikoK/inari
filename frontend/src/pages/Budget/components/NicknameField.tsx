import { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';
import { Autocomplete, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import type { IncomeFormValues } from '../const/form';

interface NicknameFieldProps {
  index: number;
  nicknames: string[];
}

export const NicknameField: FC<NicknameFieldProps> = ({ index, nicknames }) => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IncomeFormValues>();

  const nickname = watch(`lines.${index}.nickname`);

  return (
    <div>
      <Autocomplete
        freeSolo
        options={nicknames}
        inputValue={nickname}
        onInputChange={(_, value) =>
          setValue(`lines.${index}.nickname`, value, { shouldDirty: true, shouldValidate: true })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Ім’я учасника (необов’язково)"
            helperText="Оберіть нікнейм або впишіть ім’я"
          />
        )}
      />
      <ErrorMessage
        name={`lines.${index}.nickname`}
        errors={errors}
        render={({ message }) => <ErrorText>{message}</ErrorText>}
      />
    </div>
  );
};
