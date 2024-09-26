import { FunctionComponent, useState } from 'react';
import { Input, type DialogProps } from '@mui/material';
import { DialogContainer, ErrorText, Paragraph, SubmitButton } from './styles';

export interface IRequiredAuthorizationDialogProps extends Pick<DialogProps, 'open'> {
  onSubmit: () => void;
  onClose: () => void;
}

const PasswordDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  onSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const response = await fetch(`${process.env.API_URL}/settings/allow-coins/${password}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const result = await response.json();

      if (result) {
        onSubmit();
      } else {
        setError('Неправильний пароль');
      }
    } catch (error) {
      setError('Сталась системна помилка');
    }
  };

  return (
    <DialogContainer open={open} onClose={onClose}>
      <Paragraph>Введіть пароль:</Paragraph>
      <Input placeholder="Пароль" value={password} onChange={handleChange} type="password" />
      {error && <ErrorText>{error}</ErrorText>}
      <SubmitButton variant="contained" disabled={password.length < 1} onClick={handleSubmit}>
        Підтвердити
      </SubmitButton>
    </DialogContainer>
  );
};

export default PasswordDialog;
