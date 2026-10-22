import { FC } from 'react';

import { Autocomplete, TextField } from '@mui/material';

interface NicknameOption {
  value: string;
  label: string;
}

interface NicknameFilterProps {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  options: NicknameOption[];
}

export const NicknameFilter: FC<NicknameFilterProps> = ({ value, onChange, options }) => (
  <Autocomplete
    sx={{ width: '100%' }}
    options={options}
    value={options.find((option) => option.value === value) ?? null}
    onChange={(_, option) => onChange(option?.value)}
    isOptionEqualToValue={(option, selected) => option.value === selected.value}
    noOptionsText="Нікнейм не знайдено"
    renderInput={(params) => <TextField {...params} label="Нікнейм" />}
  />
);
