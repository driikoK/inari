import { FC } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

import type { ProposalRole } from '@/stores/useProposalsStore';
import { proposalRoles } from '../const/options';

interface RoleCheckboxesProps {
  value: ProposalRole[];
  onChange: (roles: ProposalRole[]) => void;
}

export const RoleCheckboxes: FC<RoleCheckboxesProps> = ({ value, onChange }) => {
  const toggle = (role: ProposalRole, checked: boolean) =>
    onChange(
      proposalRoles
        .map((option) => option.value)
        .filter((option) => (option === role ? checked : value.includes(option))),
    );

  return (
    <FormGroup sx={{ width: '100%' }}>
      {proposalRoles.map((role) => (
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
