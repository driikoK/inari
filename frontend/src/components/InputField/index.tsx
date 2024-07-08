/* eslint-disable react-hooks/exhaustive-deps */
import { useField } from 'formik';
import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { FieldContainer } from './styles';
import { FunctionComponent, useEffect, useState } from 'react';
import CreateUserDialog from '@/App/dialogs/CreateUserDialog';
import Button from '../Button';
import theme from '@theme';
import useUsersStore from '@/stores/useUsersStore';

export interface IInputProps {
  name: string;
  isDisabled?: boolean;
}

const InputField: FunctionComponent<IInputProps> = ({
  name,
  isDisabled = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [field, _, helpers] = useField(name);
  const [openDialog, setOpenDialog] = useState(false);
  const { users, getUsers } = useUsersStore();

  useEffect(() => {
    getUsers();
  }, []);

  const handleNicknameChange = (event: SelectChangeEvent) => {
    helpers.setValue({ ...field.value, nickname: event.target.value });
  };

  const handleCoinsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, '');
    helpers.setValue({ ...field.value, coin: Number(value) });
  };

  const isTablet = useMediaQuery(theme.screens.tablet);

  return (
    <FieldContainer>
      <FormControl sx={{ m: 1, width: isTablet ? 300 : '100%' }}>
        <InputLabel id="name-label">Нікнейм</InputLabel>
        <Select
          labelId="name-label"
          value={field.value.nickname}
          onChange={handleNicknameChange}
          input={<OutlinedInput label="Нікнейм" />}
        >
          {users.map((user) => (
            <MenuItem key={user.nickname} value={user.nickname}>
              {user.nickname}
            </MenuItem>
          ))}
          <div>
            <Button onClick={() => setOpenDialog(true)}>Додати</Button>
          </div>
        </Select>
      </FormControl>
      <TextField
        disabled={isDisabled}
        variant="outlined"
        placeholder='0'
        type="text"
        inputProps={{ inputMode: 'numeric', pattern: "[0-9]*" }}
        value={field.value.coin || ''}
        onChange={handleCoinsChange}
        sx={{ m: 1, width: isTablet ? 100 : '100%' }}
      />
      <CreateUserDialog
        onClose={() => setOpenDialog(false)}
        open={openDialog}
      />
    </FieldContainer>
  );
};

export default InputField;
