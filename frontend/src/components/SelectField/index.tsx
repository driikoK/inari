import {
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import Close from '@mui/icons-material/Close';

import { StyledInput, StyledInputLabel, StyledSelect } from './styles';

interface SelectFieldProps<T> {
  label: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: { value: T; label: string }[];
  width?: string | number;
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  width = '100%',
}: SelectFieldProps<T>) {
  const handleChange = (event: SelectChangeEvent<unknown> | undefined) => {
    if (event === undefined) return onChange(undefined);

    onChange(event.target.value as T | undefined);
  };

  return (
    <FormControl sx={{ width }}>
      <StyledInputLabel id={`${label.toLowerCase()}-label`}>{label}</StyledInputLabel>
      <StyledSelect
        labelId={`${label.toLowerCase()}-label`}
        input={<StyledInput label={label} />}
        value={value || ''}
        onChange={handleChange}
        endAdornment={
          value && (
            <InputAdornment sx={{ marginRight: '20px', cursor: 'pointer' }} position="end">
              <IconButton
                onClick={() => {
                  handleChange(undefined);
                }}
              >
                <Close sx={{ width: '20px', height: '20px' }} />
              </IconButton>
            </InputAdornment>
          )
        }
      >
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
