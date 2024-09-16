import { FC } from 'react';
import { FieldValues, UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form';
import { Button, ButtonGroup } from '@mui/material';

import { FieldFormValue } from '../types';

const defaultValue: FieldFormValue = {
  nickname: '',
  coins: '',
  isGuest: false,
};

interface PlusMinusButtonProps {
  maxValue: number;
  append: UseFieldArrayAppend<FieldValues, string>;
  remove: UseFieldArrayRemove;
  fields: Record<'id', string>[];
}

export const PlusMinusButton: FC<PlusMinusButtonProps> = ({ maxValue, append, remove, fields }) => {
  return (
    <ButtonGroup disableElevation variant="contained" aria-label="Basic button group">
      <Button onClick={() => append({ ...defaultValue })} disabled={fields.length >= maxValue}>
        +
      </Button>
      <Button onClick={() => remove(-1)} disabled={fields.length <= 1}>
        -
      </Button>
    </ButtonGroup>
  );
};
