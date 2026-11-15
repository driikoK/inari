import { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';
import { Autocomplete, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import type { IncomeFormValues } from '../const/form';

export interface ProjectOption {
  id: string;
  label: string;
  romaji: string;
}

interface TitleFieldProps {
  index: number;
  isRequired: boolean;
  projectOptions: ProjectOption[];
}

export const TitleField: FC<TitleFieldProps> = ({ index, isRequired, projectOptions }) => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IncomeFormValues>();

  const title = watch(`lines.${index}.title`);
  const projectId = watch(`lines.${index}.projectId`);
  const selected = projectOptions.find((option) => option.id === projectId) ?? null;

  const setTitle = (value: string, id: string) => {
    setValue(`lines.${index}.title`, value, { shouldDirty: true, shouldValidate: true });
    setValue(`lines.${index}.projectId`, id, { shouldDirty: true });
  };

  return (
    <div>
      <Autocomplete<ProjectOption, false, false, true>
        freeSolo
        options={projectOptions}
        value={selected}
        inputValue={title}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
        onInputChange={(_, value, reason) => {
          if (reason === 'input') setTitle(value, '');
          if (reason === 'clear') setTitle('', '');
        }}
        onChange={(_, option) => {
          if (option && typeof option !== 'string') setTitle(option.label, option.id);
        }}
        renderOption={({ key, ...props }, option) => (
          <li key={key} {...props}>
            <div>
              <div>{option.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{option.romaji}</div>
            </div>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={isRequired ? 'Тайтл замовлення' : 'Тайтл (необов’язково)'}
            helperText="Оберіть проєкт або впишіть назву"
          />
        )}
      />
      <ErrorMessage
        name={`lines.${index}.title`}
        errors={errors}
        render={({ message }) => <ErrorText>{message}</ErrorText>}
      />
    </div>
  );
};
