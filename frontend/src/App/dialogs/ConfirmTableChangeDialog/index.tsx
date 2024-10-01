import { FC, useRef } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { GridRowModel } from '@mui/x-data-grid';

interface DialogProps {
  computeMutation: (newRow: GridRowModel, oldRow: GridRowModel) => string | null;
  handleYes: () => void;
  handleNo: () => void;
  open: boolean;
  row?: { oldRow: GridRowModel; newRow: GridRowModel };
}
export const ConfirmTableChangeDialog: FC<DialogProps> = ({
  computeMutation,
  handleYes,
  handleNo,
  open,
  row,
}) => {
  const noButtonRef = useRef<HTMLButtonElement>(null);

  let mutation: string | null = null;
  if (row) mutation = computeMutation(row.newRow, row.oldRow);

  return (
    <Dialog maxWidth="xs" open={open} sx={{ color: 'black' }}>
      <DialogTitle>Впевнені?</DialogTitle>
      <DialogContent dividers>
        {!row ? "Натиснувши 'Так' запис видалиться" : `Натиснувши 'Так' значення ${mutation}.`}
      </DialogContent>
      <DialogActions>
        <Button ref={noButtonRef} onClick={handleNo} sx={{ color: 'black' }}>
          Ні
        </Button>
        <Button onClick={handleYes} sx={{ color: 'black' }}>
          Так
        </Button>
      </DialogActions>
    </Dialog>
  );
};
