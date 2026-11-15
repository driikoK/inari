import { FC } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import { MemberKind } from '@/types';
import { memberKindOptions } from '@/utils/constants';

interface MemberKindToggleProps {
  value: MemberKind | null;
  onChange: (value: MemberKind) => void;
}

export const MemberKindToggle: FC<MemberKindToggleProps> = ({ value, onChange }) => (
  <ToggleButtonGroup
    exclusive
    color="primary"
    size="small"
    value={value}
    onChange={(_, next: MemberKind | null) => next && onChange(next)}
  >
    {memberKindOptions.map((option) => (
      <ToggleButton key={option.value} value={option.value} sx={{ textTransform: 'none' }}>
        {option.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);
