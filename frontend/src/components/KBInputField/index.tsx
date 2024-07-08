/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { FieldContainer, Label } from './styles';
import { FunctionComponent, useEffect, useState } from 'react';
import CreateUserDialog from '@/App/dialogs/CreateUserDialog';
import Button from '../Button';
import theme from '@theme';
import useUsersStore from '@/stores/useUsersStore';

export interface IInputProps {
  mainName: string;
  dubName: string;
  sumOfAllFiles: number, 
  allPoints: number
  isDisabled?: boolean;
}

const KBInputField: FunctionComponent<IInputProps> = ({ mainName, dubName, isDisabled = false, sumOfAllFiles, allPoints }) => {
  const [field, _, helpers] = useField(mainName);
  const [dubField, __, dubHelpers] = useField(dubName);
  const [openDialog, setOpenDialog] = useState(false);
  const { users, getUsers } = useUsersStore();

  useEffect(() => {
    getUsers();
  }, [])

  useEffect(() => {
    const dubFieldValue = isNaN(Number(dubField.value)) ? 0 : Number(dubField.value);
    const proportion = sumOfAllFiles !== 0 ? dubFieldValue / sumOfAllFiles : 0;
    const points = Math.round(allPoints * proportion);

    helpers.setValue({ ...field.value, coin: points });
  }, [sumOfAllFiles])

  const handleNicknameChange = (event: SelectChangeEvent) => {
    helpers.setValue({ ...field.value, nickname: event.target.value });
  };

  const handleCoinsChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
    const dubFieldValue = isNaN(Number(dubField.value)) ? 0 : Number(dubField.value);
    const updatedSum = sumOfAllFiles - dubFieldValue + Number(value);
    const proportion = updatedSum !== 0 ? Number(value) / updatedSum : 0;
    const points = Math.round(allPoints * proportion);
    
    helpers.setValue({ ...field.value, coin: points });
    dubHelpers.setValue(value);
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
        error={isNaN(dubField.value)}
        disabled={isDisabled}
        variant="outlined"
        label="КБ"
        type="text"
        value={dubField.value}
        onChange={handleCoinsChange}
        sx={{ m: 1, width: isTablet ? 100 : '100%' }}
      />
      <Label>{field.value.coin || 0} крихт</Label>
      <CreateUserDialog onClose={() => setOpenDialog(false)} open={openDialog}/>
    </FieldContainer>
  );
};

export default KBInputField;
