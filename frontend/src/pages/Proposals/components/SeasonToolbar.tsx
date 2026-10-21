import { FC } from 'react';

import AddIcon from '@mui/icons-material/AddOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Button, Chip, Tooltip } from '@mui/material';

import type { ProposalSeason } from '@/stores/useProposalsStore';

interface SeasonToolbarProps {
  season: ProposalSeason;
  joinedCount: number;
  maxPerPerson: number;
  isAdmin: boolean;
  onAddProposal: () => void;
  onToggleClosed: () => void;
  onDelete: () => void;
}

export const SeasonToolbar: FC<SeasonToolbarProps> = ({
  season,
  joinedCount,
  maxPerPerson,
  isAdmin,
  onAddProposal,
  onToggleClosed,
  onDelete,
}) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
    {season.isClosed ? (
      <Chip icon={<LockOutlinedIcon />} label="Сезон закрито" />
    ) : (
      <Chip
        color={joinedCount >= maxPerPerson ? 'warning' : 'default'}
        label={`Ваша квота: ${joinedCount} з ${maxPerPerson}`}
      />
    )}

    <Box sx={{ flex: 1 }} />

    {isAdmin && (
      <>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          disabled={season.isClosed}
          onClick={onAddProposal}
        >
          Додати тайтл
        </Button>
        <Button variant="outlined" onClick={onToggleClosed}>
          {season.isClosed ? 'Відкрити сезон' : 'Закрити сезон'}
        </Button>
        <Tooltip title={season.isClosed ? '' : 'Спочатку закрийте сезон'}>
          <span>
            <Button variant="outlined" color="error" disabled={!season.isClosed} onClick={onDelete}>
              Видалити сезон
            </Button>
          </span>
        </Tooltip>
      </>
    )}
  </Box>
);
