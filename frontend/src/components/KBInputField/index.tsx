/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useField } from 'formik';
import {
  Autocomplete,
  FormControl,
  MenuItem,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { FieldContainer, Label } from './styles';
import { FunctionComponent, useEffect, useState } from 'react';
import CreateUserDialog from '@/App/dialogs/CreateUserDialog';
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

  const handleNicknameChange = (value: string) => {
    helpers.setValue({ ...field.value, nickname:value });
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
      <Autocomplete
          options={users}
          getOptionLabel={(option) => option.nickname}
          value={
            users.find((user) => user.nickname === field.value.nickname) || null
          }
          onChange={(_, newValue) => {
            if (newValue) {
              handleNicknameChange(newValue.nickname);
            } else {
              handleNicknameChange('');
            }
          }}
          renderInput={(params) => (
            <TextField {...params} label="Нікнейм" variant="outlined" />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option.nickname} value={option.nickname}>
              {option.nickname}
            </MenuItem>
          )}
          noOptionsText={
            <MenuItem
              sx={{ fontWeight: '500' }}
              onClick={() => setOpenDialog(true)}
            >
              Додати
            </MenuItem>
          }
        />
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
