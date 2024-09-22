import { FormControl, InputLabel, MenuItem, OutlinedInput, SelectChangeEvent } from '@mui/material';
import { ClearOptionItem, StyledSelect } from './styles';

interface SelectFieldProps<T> {
  label: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: { value: T; label: string }[];
  width?: string | number;
}

function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  width = '100%',
}: SelectFieldProps<T>) {
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    onChange(event.target.value as T | undefined);
  };

  return (
    <FormControl sx={{ width }}>
      <InputLabel id={`${label.toLowerCase()}-label`}>{label}</InputLabel>
      <StyledSelect
        labelId={`${label.toLowerCase()}-label`}
        input={<OutlinedInput label={label} />}
        value={value || ''}
        onChange={handleChange}
      >
        <MenuItem value={undefined}>
          <ClearOptionItem> Скасувати вибір </ClearOptionItem>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
}

export default SelectField;
