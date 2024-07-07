/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Snackbar,
  TextField,
  type DialogProps,
} from '@mui/material';
import { DialogContainer, InputWrapper, Title, TitleWrapper } from './styles';
import Button from '@/components/Button';
import useUsersStore from '@/stores/useUsersStore';
import useTypeStore from '@/stores/useTypesStore';

export interface IRequiredAuthorizationDialogProps
  extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const CreateUserDialog: FunctionComponent<
  IRequiredAuthorizationDialogProps
> = ({ open, onClose }) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [isPopOpen, setPopOpen] = useState<boolean>(false);
  const [popMessage, setPopMessage] = useState('');
  const { addUser } = useUsersStore();
  const { types, getTypes} = useTypeStore();

  useEffect(() => {
    getTypes();
  }, []);

  const handleSelectChange = (
    event: SelectChangeEvent<typeof selectedTypes>
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedTypes(typeof value === 'string' ? value.split(',') : value);
  };

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNickname(value);
  };
  const handleSubmit = () => {
    try { 
      addUser({ nickname, types: selectedTypes, coin: 0 });

      setPopMessage('Успішно');
      setPopOpen(true);
      setTimeout(() => {
        onClose();
      }, 1000)
    } catch (e) {
      setPopMessage('Помилка');
      setPopOpen(true);
    }
  };

  return (
    <DialogContainer open={open} onClose={onClose}>
      <TitleWrapper>
        <Title>Створення користувача</Title>
      </TitleWrapper>
      <InputWrapper>
        <TextField
          placeholder="Введіть нікнейм"
          value={nickname}
          onChange={handleNicknameChange}
        />
        <FormControl>
          <InputLabel id="demo-multiple-name-label">Типи</InputLabel>
          <Select
            labelId="multiple-name-label"
            id="multiple-name"
            multiple
            value={selectedTypes}
            onChange={handleSelectChange}
            input={<OutlinedInput label="Типи" />}
          >
            {types.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </InputWrapper>
      <Button
        variant="contained"
        disabled={nickname.length < 3 || selectedTypes.length === 0}
        onClick={handleSubmit}
      >
        Зберегти
      </Button>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={isPopOpen}
        autoHideDuration={1000}
        onClose={() => setPopOpen(false)}
        message={popMessage}
      />
    </DialogContainer>
  );
};

export default CreateUserDialog;
