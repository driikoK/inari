import { FunctionComponent } from 'react';

import { IconButton, type DialogProps } from '@mui/material';
import Close from '@mui/icons-material/Close';

import { DialogContainer } from '../InputCookieDialog/styles';
import { AddPollAnimeForm } from './AddPollAnimeForm';

export interface AddPollAnimeDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const AddPollAnimeDialog: FunctionComponent<AddPollAnimeDialogProps> = ({ open, onClose }) => {
  const handleClose = (event: any, reason: string) => {
    if (reason && reason === 'backdropClick') return;
    onClose();
  };

  return (
    <DialogContainer open={open} scroll="body" onClose={handleClose} fullWidth>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={() => ({
          position: 'absolute',
          right: 8,
          top: 8,
        })}
      >
        <Close />
      </IconButton>

      <AddPollAnimeForm onClose={onClose} />
    </DialogContainer>
  );
};

export default AddPollAnimeDialog;
