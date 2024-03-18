import { FunctionComponent } from 'react';
import { type DialogProps } from '@mui/material';
import {
  DialogContainer, Paragraph, SubmitButton,
} from './styles';


export interface IRequiredAuthorizationDialogProps
  extends Pick<DialogProps, 'open'> {
  text: string;
  onClose: () => void;
}

const InfoDialog: FunctionComponent<IRequiredAuthorizationDialogProps> = ({
  open,
  text,
  onClose,
}) => {
  return (
    <DialogContainer open={open}>
      <Paragraph>{ text }</Paragraph>
      <SubmitButton variant="contained" onClick={onClose}>Закрити</SubmitButton>
    </DialogContainer>
  );
};

export default InfoDialog;