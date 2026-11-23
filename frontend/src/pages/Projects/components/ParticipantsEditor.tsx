import { FC, useEffect, useRef, useState } from 'react';
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
  submitCount: number;
}

type TouchedField = 'nickname' | 'roles';

export const ParticipantsEditor: FC<ParticipantsEditorProps> = ({
  value,
  onChange,
  nicknames,
  errors,
  submitCount,
}) => {
  const roles = useRolesStore((state) => state.roles);
  const [touched, setTouched] = useState<Record<string, Partial<Record<TouchedField, boolean>>>>(
    {},
  );
  const latest = useRef(value);

  latest.current = value;

  // A row added a moment ago is empty on purpose, so its errors wait until the person has
  // worked with that field, or has tried to save
  useEffect(() => {
    if (submitCount === 0) return;

    setTouched((state) => ({
      ...state,
      ...Object.fromEntries(
        latest.current.map(({ key }) => [key, { nickname: true, roles: true }]),
      ),
    }));
  }, [submitCount]);

  const touch = (key: string, field: TouchedField) =>
    setTouched((state) => ({ ...state, [key]: { ...state[key], [field]: true } }));

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
                onChange={(_, nickname) => {
                  touch(participant.key, 'nickname');
                  update(index, { nickname: nickname ?? '' });
                }}
                onBlur={() => touch(participant.key, 'nickname')}
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

                  touch(participant.key, 'roles');
                  update(index, {
                    roles: roles
                      .map((option) => option.value)
                      .filter((role) => picked.includes(role)),
                  });
                }}
                slotProps={{
                  select: {
                    multiple: true,
                    onClose: () => touch(participant.key, 'roles'),
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

            {touched[participant.key]?.nickname && rowErrors?.nickname?.message && (
              <ErrorText>{rowErrors.nickname.message}</ErrorText>
            )}
            {touched[participant.key]?.roles && rowErrors?.roles?.message && (
              <ErrorText>{rowErrors.roles.message}</ErrorText>
            )}
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
