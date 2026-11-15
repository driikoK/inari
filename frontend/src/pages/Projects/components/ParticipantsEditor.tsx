import { FC } from 'react';
import type { FieldErrors } from 'react-hook-form';

import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Autocomplete, Box, Button, IconButton, MenuItem, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import useRolesStore from '@/stores/useRolesStore';
import { participantRow, type ParticipantFormValues, type ProjectFormValues } from '../const/form';

interface ParticipantsEditorProps {
  value: ParticipantFormValues[];
  onChange: (participants: ParticipantFormValues[]) => void;
  nicknames: string[];
  errors?: FieldErrors<ProjectFormValues>['participants'];
}

export const ParticipantsEditor: FC<ParticipantsEditorProps> = ({
  value,
  onChange,
  nicknames,
  errors,
}) => {
  const roles = useRolesStore((state) => state.roles);

  const roleLabel = (role: string) => roles.find((option) => option.value === role)?.label ?? role;

  const update = (index: number, patch: Partial<ParticipantFormValues>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const taken = (index: number) =>
    new Set(value.filter((_, i) => i !== index).map(({ nickname }) => nickname.toLowerCase()));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
      {value.map((participant, index) => {
        const busy = taken(index);
        const rowErrors = errors?.[index];

        return (
          <Box key={participant.key} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1 }}>
              <Autocomplete
                sx={{ flex: '1 1 180px' }}
                options={nicknames.filter((nickname) => !busy.has(nickname.toLowerCase()))}
                value={participant.nickname || null}
                onChange={(_, nickname) => update(index, { nickname: nickname ?? '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Нікнейм"
                    size="small"
                    helperText={
                      participant.source && !participant.nickname
                        ? `З пропозиції: ${participant.source}`
                        : undefined
                    }
                  />
                )}
              />

              <TextField
                select
                size="small"
                label="Ролі"
                sx={{ flex: '1 1 180px' }}
                value={participant.roles}
                onChange={(event) => {
                  const picked = event.target.value as unknown as string[];

                  update(index, {
                    roles: roles
                      .map((option) => option.value)
                      .filter((role) => picked.includes(role)),
                  });
                }}
                slotProps={{
                  select: {
                    multiple: true,
                    renderValue: (selected) => (selected as string[]).map(roleLabel).join(', '),
                  },
                }}
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>

              <IconButton aria-label="Прибрати учасника" onClick={() => remove(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>

            {rowErrors?.nickname?.message && <ErrorText>{rowErrors.nickname.message}</ErrorText>}
            {rowErrors?.roles?.message && <ErrorText>{rowErrors.roles.message}</ErrorText>}
          </Box>
        );
      })}

      <Button
        startIcon={<AddIcon />}
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => onChange([...value, participantRow()])}
      >
        Додати учасника
      </Button>
    </Box>
  );
};
