import { FC } from 'react';
import toast from 'react-hot-toast';

import { MenuItem, Select, SelectChangeEvent } from '@mui/material';

import { useMembersStore } from '@/stores';
import { MemberKind } from '@/types';
import { memberKindOptions, UNMARKED_KIND_LABEL } from '@/utils/constants';

interface MemberKindCellProps {
  memberId: string;
  kind?: MemberKind | null;
  editable: boolean;
}

export const MemberKindCell: FC<MemberKindCellProps> = ({ memberId, kind, editable }) => {
  const updateMemberKind = useMembersStore((state) => state.updateMemberKind);

  const label = memberKindOptions.find((option) => option.value === kind)?.label;

  if (!editable) {
    return <span style={{ color: label ? undefined : 'var(--text-faint)' }}>{label ?? '—'}</span>;
  }

  const handleChange = async (e: SelectChangeEvent<MemberKind | ''>) => {
    try {
      await updateMemberKind(memberId, e.target.value as MemberKind);
      toast.success('Тип нікнейма оновлено');
    } catch {
      // The axios interceptor already shows the server's message
    }
  };

  return (
    <Select<MemberKind | ''>
      size="small"
      displayEmpty
      value={kind ?? ''}
      onChange={handleChange}
      renderValue={(value) =>
        value ? label : <span style={{ color: 'var(--orange)' }}>{UNMARKED_KIND_LABEL}</span>
      }
      sx={{ fontSize: 13, minWidth: 170 }}
    >
      {memberKindOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};
