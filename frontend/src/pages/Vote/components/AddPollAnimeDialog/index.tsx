import { FunctionComponent } from 'react';

import { type DialogProps } from '@mui/material';

import { AddPollAnimeForm } from './AddPollAnimeForm';
import { CustomDialog } from '@/components';

export interface AddPollAnimeDialogProps extends Pick<DialogProps, 'open'> {
  onClose: () => void;
}

const AddPollAnimeDialog: FunctionComponent<AddPollAnimeDialogProps> = ({ open, onClose }) => {
  return (
    <CustomDialog open={open} onClose={onClose}>
      <AddPollAnimeForm onClose={onClose} />
    </CustomDialog>
  );
};

export default AddPollAnimeDialog;
