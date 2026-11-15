import { FC, MouseEvent } from 'react';
import { OutlinedTextFieldProps, TextField } from '@mui/material';

type DateInputProps = Omit<OutlinedTextFieldProps, 'variant' | 'type' | 'slotProps'> & {
  min?: string;
  max?: string;
};

// The browser opens its calendar only from the small icon of a date field. The handler sits on the frame of the field, not on the <input>, so a click on the padding around the text opens it too.
const openCalendar = (event: MouseEvent<HTMLElement>) => {
  const input = event.currentTarget.querySelector('input');

  if (input && !input.disabled && !input.readOnly && typeof input.showPicker === 'function') {
    input.showPicker();
  }
};

export const DateInput: FC<DateInputProps> = ({ min, max, ...props }) => (
  <TextField
    {...props}
    type="date"
    slotProps={{
      inputLabel: { shrink: true },
      input: { onClick: openCalendar, sx: { cursor: 'pointer' } },
      htmlInput: { min, max },
    }}
  />
);
