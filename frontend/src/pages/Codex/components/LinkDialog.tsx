import { FC, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

import { isValidHref, normalizeHref } from '../const/extensions';

interface LinkDialogProps {
  open: boolean;
  href: string;
  onApply: (href: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export const LinkDialog: FC<LinkDialogProps> = ({ open, href, onApply, onRemove, onClose }) => {
  const [value, setValue] = useState(href);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(href);
      setError('');
    }
  }, [open, href]);

  const handleApply = () => {
    const normalized = normalizeHref(value);

    if (!isValidHref(normalized)) {
      setError('Введіть адресу сайту або пошти, наприклад https://example.com');

      return;
    }

    onApply(normalized);
  };

  return (
    <Dialog maxWidth="xs" fullWidth open={open} onClose={onClose} sx={{ color: 'black' }}>
      <DialogTitle>Посилання</DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          label="Адреса"
          value={value}
          error={Boolean(error)}
          helperText={error || 'http://, https:// або mailto:'}
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleApply();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        {href && (
          <Button color="error" onClick={onRemove} sx={{ marginRight: 'auto' }}>
            Прибрати посилання
          </Button>
        )}
        <Button onClick={onClose}>Скасувати</Button>
        <Button onClick={handleApply}>Застосувати</Button>
      </DialogActions>
    </Dialog>
  );
};
