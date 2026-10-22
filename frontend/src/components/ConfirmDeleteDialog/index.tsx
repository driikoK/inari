import { FC } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
  open,
  title,
  message,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog maxWidth="xs" open={open} onClose={onCancel} sx={{ color: 'black' }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          Скасувати
        </Button>
        <Button color="error" onClick={onConfirm} disabled={isLoading}>
          Видалити
        </Button>
      </DialogActions>
    </Dialog>
  );
};
