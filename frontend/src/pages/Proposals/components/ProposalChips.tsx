import { FC } from 'react';
import { Chip, Stack } from '@mui/material';

import type { Proposal } from '@/stores/useProposalsStore';
import { PROPOSAL_FUNDING } from '@/types';

const chipSx = (token: string) => ({
  color: `var(${token})`,
  background: `color-mix(in srgb, var(${token}) 14%, transparent)`,
  border: `1px solid color-mix(in srgb, var(${token}) 35%, transparent)`,
  fontWeight: 600,
});

type ProposalChipsProps = Pick<Proposal, 'isOngoing' | 'isSequel' | 'funding'>;

export const ProposalChips: FC<ProposalChipsProps> = ({ isOngoing, isSequel, funding }) => (
  <Stack direction="row" flexWrap="wrap" gap={0.75}>
    <Chip
      size="small"
      label={isOngoing ? 'Онґоїнґ' : 'Стареча'}
      sx={chipSx(isOngoing ? '--accent' : '--text-muted')}
    />
    {funding === PROPOSAL_FUNDING.PATRON && (
      <Chip size="small" label="Меценатський" sx={chipSx('--green')} />
    )}
    {funding === PROPOSAL_FUNDING.ORDER && (
      <Chip size="small" label="Замовлення" sx={chipSx('--orange')} />
    )}
    {isSequel && <Chip size="small" label="Продовження" sx={chipSx('--teal')} />}
  </Stack>
);
