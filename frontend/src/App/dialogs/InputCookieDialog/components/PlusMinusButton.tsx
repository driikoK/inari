import { Button, ButtonGroup } from '@mui/material';
import { useFormikContext, useField } from 'formik';
import { FieldFormValue } from '../types';
import { FC } from 'react';

const defaultValue: FieldFormValue = {
  nickname: '',
  coins: '',
  isGuest: false,
};

interface PlusMinusButtonProps {
  name: string;
  maxValue: number;
}

export const PlusMinusButton: FC<PlusMinusButtonProps> = ({ name, maxValue }) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField<FieldFormValue[]>(name);

  const handleOnAddField = () => {
    setFieldValue(name, [...field.value, defaultValue]);
  };

  const handleOnRemoveField = () => {
    if (field.value.length > 1) {
      const newValue = field.value.slice(0, -1);
      setFieldValue(name, newValue);
    }
  };

  return (
    <ButtonGroup disableElevation variant="contained" aria-label="Basic button group">
      <Button onClick={handleOnAddField} disabled={field.value.length >= maxValue}>
        +
      </Button>
      <Button onClick={handleOnRemoveField} disabled={field.value.length <= 1}>
        -
      </Button>
    </ButtonGroup>
  );
};
