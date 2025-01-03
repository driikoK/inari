import { FunctionComponent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  type DialogProps,
} from '@mui/material';

import { DialogContainer, InputWrapper, Title, TitleWrapper } from './styles';
import { Button } from '@/components';
import { useMembersStore, useRolesStore } from '@/stores';

export interface IRequiredAuthorizationDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const CreateUserDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  onClose,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const { addMember } = useMembersStore();
  const { roles, getRoles } = useRolesStore();

  useEffect(() => {
    getRoles();
  }, []);

  const handleSelectChange = (event: SelectChangeEvent<typeof selectedTypes>) => {
    const {
      target: { value },
    } = event;
    setSelectedTypes(typeof value === 'string' ? value.split(',') : value);
  };

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNickname(value);
  };

  const handleSubmit = async () => {
    try {
      await addMember({ nickname, types: selectedTypes, coins: 0, seasons: [] });

      toast.success('Новий мембер створений успішно!');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      toast.error('Помилка!');
    }
  };

  return (
    <DialogContainer open={open} onClose={onClose}>
      <TitleWrapper>
        <Title>Створення користувача</Title>
      </TitleWrapper>
      <InputWrapper>
        <TextField placeholder="Введіть нікнейм" value={nickname} onChange={handleNicknameChange} />
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
            {roles.map((role, index) => (
              <MenuItem key={index} value={role.value}>
                {role.label}
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
    </DialogContainer>
  );
};

export default CreateUserDialog;
