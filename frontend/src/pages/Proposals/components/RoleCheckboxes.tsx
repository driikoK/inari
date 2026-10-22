import { FC } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

import useRolesStore from '@/stores/useRolesStore';

interface RoleCheckboxesProps {
  value: string[];
  onChange: (roles: string[]) => void;
}

export const RoleCheckboxes: FC<RoleCheckboxesProps> = ({ value, onChange }) => {
  const roles = useRolesStore((state) => state.roles);

  const toggle = (role: string, checked: boolean) =>
    onChange(
      roles
        .map((option) => option.value)
        .filter((option) => (option === role ? checked : value.includes(option))),
    );

  return (
    <FormGroup sx={{ width: '100%' }}>
      {roles.map((role) => (
        <FormControlLabel
          key={role.value}
          label={role.label}
          control={
            <Checkbox
              checked={value.includes(role.value)}
              onChange={(event) => toggle(role.value, event.target.checked)}
            />
          }
        />
      ))}
    </FormGroup>
  );
};
