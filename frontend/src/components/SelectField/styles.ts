import { Select, selectClasses, styled, InputLabel, OutlinedInput } from '@mui/material';

export const StyledSelect = styled(Select)({
  backgroundColor: 'white',
});

export const StyledInputLabel = styled(InputLabel)({
  [`&.${selectClasses.focused}`]: {
    color: 'black',
  },
});

export const StyledInput = styled(OutlinedInput)(() => ({
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)',
  },
}));
