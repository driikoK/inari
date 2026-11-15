import { FC } from 'react';

import { Autocomplete, TextField, createFilterOptions } from '@mui/material';

export interface SearchOption {
  value: string;
  label: string;
  // A second line under the label, searched too
  hint?: string;
  // More text to find the option by, which is not shown
  keywords?: string;
  group?: string;
}

interface SearchSelectProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: SearchOption[];
  noOptionsText?: string;
}

const filterOptions = createFilterOptions<SearchOption>({
  stringify: ({ label, hint, keywords }) => [label, hint, keywords].filter(Boolean).join(' '),
});

export const SearchSelect: FC<SearchSelectProps> = ({
  label,
  value,
  onChange,
  options,
  noOptionsText = 'Нічого не знайдено',
}) => {
  const hasGroups = options.some(({ group }) => group);

  return (
    <Autocomplete
      sx={{ width: '100%' }}
      options={options}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(_, option) => onChange(option?.value)}
      filterOptions={filterOptions}
      groupBy={hasGroups ? ({ group }) => group ?? '' : undefined}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.value === selected.value}
      noOptionsText={noOptionsText}
      renderInput={(params) => <TextField {...params} label={label} />}
      renderOption={({ key, ...props }, option) => (
        <li key={key} {...props}>
          <div>
            <div>{option.label}</div>
            {option.hint && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{option.hint}</div>
            )}
          </div>
        </li>
      )}
    />
  );
};
