import { FastField, Field, FieldArray, useField } from 'formik';
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { Dispatch, FC, FunctionComponent, SetStateAction, useState, useTransition } from 'react';

import CreateUserDialog from '@/App/dialogs/CreateUserDialog';
import theme from '@theme';
import { FieldContainer } from '@/components/InputField/styles';
import { FieldFormValue } from '../types';
import { Paragraph } from '../styles';
import { UserType } from '@/types';
import useUsersStore from '@/stores/useUsersStore';

export interface FormFieldProps {
  name: string;
  isDisabled?: boolean;
  label: string;
  isArray?: boolean;
  users?: UserType[];
}

export const FormField: FunctionComponent<FormFieldProps> = ({
  name,
  isDisabled,
  label,
  isArray,
  // users,
}) => {
  const [field] = useField<FieldFormValue | FieldFormValue[]>(name);
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Box>
      <Paragraph>{label}:</Paragraph>

      {isArray ? (
        <FieldArray name={`${field.name}`}>
          {() => (
            <>
              {(field.value as FieldFormValue[]).map((_, index) => (
                <div key={index}>
                  <InputFields
                    name={`${field.name}.${index}`}
                    setOpenDialog={setOpenDialog}
                    isDisabled={isDisabled}
                    // users={users}
                  />
                </div>
              ))}
            </>
          )}
        </FieldArray>
      ) : (
        <InputFields
          name={`${field.name}`}
          setOpenDialog={setOpenDialog}
          isDisabled={isDisabled}
          // users={users}
        />
      )}

      {openDialog && <CreateUserDialog onClose={() => setOpenDialog(false)} open={openDialog} />}
    </Box>
  );
};

interface InputFieldsProps {
  name: string;
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
  isDisabled?: boolean;
  users?: UserType[];
}

const InputFields: FC<InputFieldsProps> = ({ name, setOpenDialog, isDisabled }) => {
  const { users } = useUsersStore();
  const handleCoinsChange = (value: string, currentField: any) => {
    if (Number(value) < 0) return;

    currentField.onChange({
      target: {
        name: currentField.name,
        value: value,
      },
    });
  };

  const isTablet = useMediaQuery(theme.screens.tablet);

  if (!users) return <div>Loading...</div>;

  return (
    <FieldContainer>
      <FastField name={`${name}.nickname`}>
        {({ field }: any) => (
          <AutocompleteField field={field} />
          // <Autocomplete
          //   options={users}
          //   getOptionLabel={(option) => option.nickname}
          //   value={users.find((user) => user.nickname === field.value) || null}
          //   onChange={(_, newValue) => {
          //     field.onChange({
          //       target: {
          //         name: field.name,
          //         value: newValue?.nickname,
          //       },
          //     });
          //   }}
          //   renderInput={(params) => <TextField {...params} label="Нікнейм" variant="outlined" />}
          //   renderOption={(props, option) => (
          //     <MenuItem {...props} key={option.nickname} value={option.nickname}>
          //       {option.nickname}
          //     </MenuItem>
          //   )}
          //   noOptionsText={
          //     <MenuItem sx={{ fontWeight: '500' }} onClick={() => setOpenDialog(true)}>
          //       Додати
          //     </MenuItem>
          //   }
          //   sx={{ width: isTablet ? '80%' : '100%' }}
          // />
        )}
      </FastField>

      <FastField name={`${name}.coins`}>
        {({ field }: any) => (
          <TextField
            disabled={isDisabled}
            variant="outlined"
            placeholder="0"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            type="number"
            {...field}
            onChange={(e) => {
              handleCoinsChange(e.target.value, field);
            }}
            sx={{ width: isTablet ? '20%' : '100%' }}
          />
        )}
      </FastField>

      <FastField name={`${name}.isGuest`}>
        {({ field: checkboxField }: any) => (
          <FormControlLabel
            label="Гість"
            control={
              <Checkbox
                name={checkboxField.name}
                checked={checkboxField.value}
                onChange={(e) => {
                  checkboxField.onChange({
                    target: {
                      name: checkboxField.name,
                      value: e.target.checked,
                    },
                  });
                }}
              />
            }
          />
        )}
      </FastField>
    </FieldContainer>
  );
};

const AutocompleteField = ({ field }: any) => {
  const { users } = useUsersStore();
  const isTablet = useMediaQuery(theme.screens.tablet);

  return (
    <Autocomplete
      options={users}
      getOptionLabel={(option) => option.nickname}
      value={users.find((user) => user.nickname === field.value) || null}
      onChange={(_, newValue) => {
        field.onChange({
          target: {
            name: field.name,
            value: newValue?.nickname,
          },
        });
      }}
      renderInput={(params) => <TextField {...params} label="Нікнейм" variant="outlined" />}
      renderOption={(props, option) => (
        <MenuItem {...props} key={option.nickname} value={option.nickname}>
          {option.nickname}
        </MenuItem>
      )}
      noOptionsText={
        // <MenuItem sx={{ fontWeight: '500' }} onClick={() => setOpenDialog(true)}>
        <MenuItem sx={{ fontWeight: '500' }}>Додати</MenuItem>
      }
      sx={{ width: isTablet ? '80%' : '100%' }}
    />
  );
};
