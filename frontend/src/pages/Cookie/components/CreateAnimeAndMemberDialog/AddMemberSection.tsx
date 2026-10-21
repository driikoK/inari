import { FC, useState } from 'react';

import { Box, Button, TextField } from '@mui/material';

import { H6, MemberKindToggle } from '@/components';
import { MemberKind } from '@/types';

interface AddMemberSectionProps {
  onSubmit: (nickname: string, kind: MemberKind) => void;
}

export const AddMemberSection: FC<AddMemberSectionProps> = ({ onSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [kind, setKind] = useState<MemberKind | null>(null);

  const handleAdd = () => {
    if (!kind) return;

    onSubmit(nickname, kind);
    setNickname('');
    setKind(null);
  };

  return (
    <>
      <H6>Додати учасника</H6>

      <Box display="flex" gap={2} width="100%">
        <TextField
          placeholder="Введіть назву"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          sx={{ width: '100%' }}
        />
        <Button variant="contained" disabled={!nickname || !kind} onClick={handleAdd}>
          Додати
        </Button>
      </Box>

      <MemberKindToggle value={kind} onChange={setKind} />
    </>
  );
};
