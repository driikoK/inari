import React, { FC } from 'react';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import { Box, Chip, Link, ListItem } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { H5, P, Icon } from '@/components';
import { Result } from '@/stores/usePollStore';
import { ROLES_ON_VOTE } from '@/types';
import MalImg from '/mal.png';

interface IPropList {
  result: Result;
}

const rolesForTitle = {
  [ROLES_ON_VOTE.DUB]: 'Дабер',
  [ROLES_ON_VOTE.SUB]: 'Перекладач',
  [ROLES_ON_VOTE.FIXER]: 'Фіксер',
  [ROLES_ON_VOTE.RELEASER]: 'Релізер',
  [ROLES_ON_VOTE.SOUND]: 'Звукареж',
  [ROLES_ON_VOTE.DIRECTOR]: 'Куратор',
};

const roleColor: Record<
  ROLES_ON_VOTE,
  'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'default'
> = {
  [ROLES_ON_VOTE.DUB]: 'primary',
  [ROLES_ON_VOTE.SUB]: 'default',
  [ROLES_ON_VOTE.FIXER]: 'info',
  [ROLES_ON_VOTE.RELEASER]: 'success',
  [ROLES_ON_VOTE.SOUND]: 'warning',
  [ROLES_ON_VOTE.DIRECTOR]: 'error',
};

const VoteList: FC<IPropList> = ({ result }) => {
  const { animeName, totalVotes, votes, link } = result;

  return (
    <>
      <List
        sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        subheader={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <H5 sx={{ padding: 2, textAlign: 'center' }}>{animeName}</H5>

            <Link href={link} target="_blank">
              <Icon img={MalImg} />
            </Link>
          </Box>
        }
      >
        <P sx={{ paddingLeft: 2, fontWeight: '600' }}>Всього голосів: {totalVotes}</P>
        <P sx={{ paddingLeft: 2, fontWeight: '600' }}>Голосували:</P>

        {votes.map((vote) => (
          <React.Fragment key={vote.userName}>
            <Grid container>
              <Grid size={1}>
                <ListItem>
                  <ListItemText primary={`${vote.userName}:`} sx={{ fontWeight: '600' }} />
                </ListItem>
              </Grid>

              {vote.roles
                .sort((a, b) => rolesForTitle[a].localeCompare(rolesForTitle[b]))
                .map((role) => (
                  <Grid size={1.7} key={role}>
                    <ListItem sx={{ pt: 0, pb: 0 }}>
                      <Chip
                        label={rolesForTitle[role]}
                        color={roleColor[role]}
                        sx={{ padding: 1, mt: 1, width: '100%' }}
                      />
                    </ListItem>
                  </Grid>
                ))}
            </Grid>
          </React.Fragment>
        ))}
      </List>
    </>
  );
};

export default VoteList;
