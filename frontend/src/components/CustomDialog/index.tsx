import { PropsWithChildren } from 'react';
import { Button, Dialog, DialogProps, IconButton } from '@mui/material';
import Close from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './CustomDialog.module.scss';

type CustomDialogProps = {
  onClose: () => void;
  isShowBack?: boolean;
  onBack?: () => void;
} & DialogProps &
  PropsWithChildren;

const CustomDialog = ({ onClose, onBack, isShowBack, open, children }: CustomDialogProps) => {
  const handleClose = (event: any, reason: string) => {
    if (reason && reason === 'backdropClick') return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      scroll="body"
      PaperProps={{
        sx: {
          padding: { xs: '16px', lg: '30px' },
          paddingTop: { xs: '40px', lg: '50px' },
          gap: { xs: '16px', lg: '28px' },
          borderRadius: '12px',
        },
      }}
    >
      <div className={styles.dialogHeader}>
        {isShowBack && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ paddingLeft: '20px' }}
            color="secondary"
          >
            Назад
          </Button>
        )}

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </div>

      <div className={styles.dialogBody}>{children}</div>
    </Dialog>
  );
};

export default CustomDialog;
