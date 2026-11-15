import { FC } from 'react';
import { Chip, Stack } from '@mui/material';

import type { ProjectView } from '@/stores/useProjectsStore';
import { PROJECT_MARK, PROPOSAL_FUNDING } from '@/types';
import { markLabels } from '../const/options';

const chipSx = (token: string) => ({
  color: `var(${token})`,
  background: `color-mix(in srgb, var(${token}) 14%, transparent)`,
  border: `1px solid color-mix(in srgb, var(${token}) 35%, transparent)`,
  fontWeight: 600,
});

const markTokens: Record<PROJECT_MARK, string> = {
  [PROJECT_MARK.ONGOING]: '--accent',
  [PROJECT_MARK.OLD]: '--text-muted',
  [PROJECT_MARK.DEBT]: '--red',
};

type ProjectChipsProps = Pick<ProjectView, 'mark' | 'funding' | 'isSequel' | 'isFinished'>;

export const ProjectChips: FC<ProjectChipsProps> = ({ mark, funding, isSequel, isFinished }) => (
  <Stack direction="row" flexWrap="wrap" gap={0.75}>
    <Chip size="small" label={markLabels[mark]} sx={chipSx(markTokens[mark])} />
    {funding === PROPOSAL_FUNDING.PATRON && (
      <Chip size="small" label="Меценатський" sx={chipSx('--green')} />
    )}
    {funding === PROPOSAL_FUNDING.ORDER && (
      <Chip size="small" label="Замовлення" sx={chipSx('--orange')} />
    )}
    {isSequel && <Chip size="small" label="Продовження" sx={chipSx('--teal')} />}
    {isFinished && <Chip size="small" label="Завершено" sx={chipSx('--text-faint')} />}
  </Stack>
);
