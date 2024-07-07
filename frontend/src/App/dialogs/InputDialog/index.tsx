import { FunctionComponent, useState } from 'react';
import { Input, type DialogProps } from '@mui/material';
import { DialogContainer, ErrorText, Paragraph, SubmitButton } from './styles';

export interface IRequiredAuthorizationDialogProps
  extends Pick<DialogProps, 'open'> {
  userName: string;
  onSubmit: (userName: string) => void;
  onClose: () => void;
}

const InputDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  userName,
  onSubmit,
  onClose,
}) => {
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length < 3) {
      setError('Ви ввели менше 3 символів');
    } else {
      setError('');
    }
    onSubmit(value);
  };

  return (
    <DialogContainer open={open}>
      <Paragraph>Введіть свій нікнейм:</Paragraph>
      <Input
        placeholder="Ваш нікнейм"
        value={userName}
        onChange={handleChange}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <SubmitButton
        variant="contained"
        disabled={userName.length < 3}
        onClick={onClose}
      >
        Підтвердити
      </SubmitButton>
    </DialogContainer>
  );
};

export default InputDialog;
