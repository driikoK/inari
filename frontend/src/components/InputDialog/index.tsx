import { FunctionComponent } from 'react';
import { Input, type DialogProps } from '@mui/material';
import {
  DialogContainer, Paragraph, SubmitButton,
} from './styles';


export interface IRequiredAuthorizationDialogProps
  extends Pick<DialogProps, 'open'> {
  userName: string,
  onSubmit: (userName: string) => void;
  onClose: () => void;
}

const InputDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  userName,
  onSubmit,
  onClose,
}) => {
  return (
    <DialogContainer open={open}>
      <Paragraph>Введіть свій нікнейм:</Paragraph>
      <Input placeholder='Ваш нікнейм' value={userName} onChange={(e) => onSubmit(e.target.value)}/>
      <SubmitButton variant="contained" onClick={onClose}>Підтвердити</SubmitButton>
    </DialogContainer>
  );
};

export default InputDialog;