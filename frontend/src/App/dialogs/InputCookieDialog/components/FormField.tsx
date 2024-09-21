import { FC, FunctionComponent, useEffect, useState } from 'react';
import {
  Controller,
  ControllerRenderProps,
  FieldValues,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  useMediaQuery,
} from '@mui/material';

import { PlusMinusButton } from './PlusMinusButton';
import { ErrorText, FieldContainer, Paragraph } from '../styles';
import theme from '@theme';
import CreateUserDialog from '@/App/dialogs/CreateUserDialog';
import { UserType } from '@/types';
import useUsersStore from '@/stores/useUsersStore';

export interface FormFieldProps {
  name: string;
  isDisabled?: boolean;
  label: string;
  isArray?: boolean;
  users?: UserType[];
  maxLength?: number;
}

export const FormField: FunctionComponent<FormFieldProps> = ({
  name,
  isDisabled,
  label,
  isArray,
  maxLength = 10,
}) => {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Box>
      <Paragraph>{label}:</Paragraph>

      {isArray ? (
        <ArrayField
          name={name}
          onOpenDialog={() => setOpenDialog(true)}
          isDisabled={isDisabled}
          maxLength={maxLength}
        />
      ) : (
        <InputFields name={name} onOpenDialog={() => setOpenDialog(true)} isDisabled={isDisabled} />
      )}

      {openDialog && <CreateUserDialog onClose={() => setOpenDialog(false)} open={openDialog} />}
    </Box>
  );
};

interface ArrayFieldProps {
  name: string;
  onOpenDialog: () => void;
  isDisabled?: boolean;
  maxLength: number;
}

const ArrayField: FC<ArrayFieldProps> = ({ name, onOpenDialog, isDisabled, maxLength }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    rules: { maxLength, minLength: 1 },
  });

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id}>
          <InputFields
            name={`${name}.${index}`}
            onOpenDialog={onOpenDialog}
            isDisabled={isDisabled}
          />
        </div>
      ))}

      <PlusMinusButton maxValue={maxLength} append={append} remove={remove} fields={fields} />
    </>
  );
};

interface InputFieldsProps extends Omit<ArrayFieldProps, 'maxLength'> {}

const InputFields: FC<InputFieldsProps> = ({ name, onOpenDialog, isDisabled }) => {
  const { users } = useUsersStore();
  const {
    register,
    control,
    resetField,
    formState: { errors },
  } = useFormContext();

  const isTablet = useMediaQuery(theme.screens.tablet);

  const nickname = useWatch({
    name: `${name}.nickname`,
  });

  const handleCoinsChange = (
    value: string,
    currentField: ControllerRenderProps<FieldValues, `${string}.coins`>
  ) => {
    const numberValue = Number(value.replace(/[^0-9]/g, ''));

    // ** While don't have validation of field value
    if (numberValue > 999) return;

    currentField.onChange(numberValue);
  };

  useEffect(() => {
    if (!nickname) {
      resetField(`${name}.coins`);
    }
  }, [nickname]);

  return (
    <>
      <FieldContainer>
        <Controller
          control={control}
          name={`${name}.nickname`}
          render={({ field }) => (
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.nickname}
              value={users.find((user) => user.nickname === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue?.nickname);
              }}
              renderInput={(params) => <TextField {...params} label="Нікнейм" variant="outlined" />}
              renderOption={(props, option) => (
                <MenuItem {...props} key={option.nickname} value={option.nickname}>
                  {option.nickname}
                </MenuItem>
              )}
              noOptionsText={
                <MenuItem sx={{ fontWeight: '500' }} onClick={onOpenDialog}>
                  Додати
                </MenuItem>
              }
              sx={{ width: isTablet ? '80%' : '100%' }}
            />
          )}
        />

        <Controller
          control={control}
          name={`${name}.coins`}
          render={({ field }) => (
            <TextField
              disabled={isDisabled || !nickname}
              variant="outlined"
              placeholder="0"
              type="text"
              value={field.value}
              onChange={(e) => {
                handleCoinsChange(e.target.value, field);
              }}
              sx={{ width: isTablet ? '20%' : '100%' }}
            />
          )}
        />

        <FormControlLabel label="Гість" control={<Checkbox {...register(`${name}.isGuest`)} />} />
      </FieldContainer>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <ErrorMessage
          errors={errors}
          name={`${name}.nickname`}
          render={({ message }) => <ErrorText>{message}</ErrorText>}
        />
        <ErrorMessage
          errors={errors}
          name={`${name}.coins`}
          render={({ message }) => <ErrorText>{message}</ErrorText>}
        />
      </Box>
    </>
  );
};
