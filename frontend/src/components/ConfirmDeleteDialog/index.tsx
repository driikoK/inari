import { FC, useRef } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  isLoading?: boolean;
  // For what cannot be taken back: Enter and Space then press «Скасувати», not the red button
  autoFocusCancel?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'error' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
  open,
  title,
  message,
  isLoading = false,
  autoFocusCancel = false,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  confirmColor = 'error',
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      maxWidth="xs"
      open={open}
      onClose={onCancel}
      sx={{ color: 'black' }}
      slotProps={{
        transition: { onEntered: () => autoFocusCancel && cancelRef.current?.focus() },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{message}</DialogContent>
      <DialogActions>
        <Button ref={cancelRef} onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button color={confirmColor} onClick={onConfirm} disabled={isLoading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
