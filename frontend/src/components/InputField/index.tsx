/* eslint-disable react-hooks/exhaustive-deps */
import { useField } from 'formik';
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { FieldContainer } from './styles';
import { FunctionComponent, useEffect, useState } from 'react';
import CreateUserDialog from '@/App/dialogs/CreateUserDialog';
import theme from '@theme';
import useUsersStore from '@/stores/useUsersStore';

export interface IInputProps {
  name: string;
  isDisabled?: boolean;
}

const InputField: FunctionComponent<IInputProps> = ({ name, isDisabled = false }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [field, _, helpers] = useField(name);
  const [openDialog, setOpenDialog] = useState(false);
  const { users, getUsers } = useUsersStore();

  useEffect(() => {
    getUsers();
  }, []);

  const handleNicknameChange = (value: string) => {
    helpers.setValue({ ...field.value, nickname: value });
  };

  const handleCoinsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, '');
    helpers.setValue({ ...field.value, coin: Number(value) });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    helpers.setValue({ ...field.value, isGuest: event.target.checked });
  };

  const isTablet = useMediaQuery(theme.screens.tablet);

  return (
    <FieldContainer>
      <FormControl sx={{ m: 1, width: isTablet ? 300 : '100%' }}>
        <Autocomplete
          options={users}
          getOptionLabel={(option) => option.nickname}
          value={users.find((user) => user.nickname === field.value.nickname) || null}
          onChange={(_, newValue) => {
            if (newValue) {
              handleNicknameChange(newValue.nickname);
            } else {
              handleNicknameChange('');
            }
          }}
          renderInput={(params) => <TextField {...params} label="Нікнейм" variant="outlined" />}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option.nickname} value={option.nickname}>
              {option.nickname}
            </MenuItem>
          )}
          noOptionsText={
            <MenuItem sx={{ fontWeight: '500' }} onClick={() => setOpenDialog(true)}>
              Додати
            </MenuItem>
          }
        />
      </FormControl>
      <TextField
        disabled={isDisabled}
        variant="outlined"
        placeholder="0"
        type="text"
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        value={field.value.coin || ''}
        onChange={handleCoinsChange}
        sx={{ m: 1, width: isTablet ? 100 : '100%' }}
      />
      <FormControlLabel
        control={<Checkbox value={field.value.isGuest} onChange={handleCheckboxChange} />}
        label="Гість"
      />

      <CreateUserDialog onClose={() => setOpenDialog(false)} open={openDialog} />
    </FieldContainer>
  );
};

export default InputField;
