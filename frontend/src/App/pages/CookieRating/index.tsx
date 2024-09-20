import { FunctionComponent, useEffect } from 'react';

import { Box, Paper } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import useSeasonsStore from '@/stores/useSeasons';
import useTracksStore from '@/stores/useTracksStore';
import useRolesStore from '@/stores/useRolesStore';
import useUsersStore from '@/stores/useUsersStore';
import { CustomTable } from '@/components/CustomTable';
import { RatingFilters } from './RatingFilters';

const CookieRating: FunctionComponent = () => {
  const { seasons, getSeasons } = useSeasonsStore();
  const { getTracks } = useTracksStore();
  const { getRoles } = useRolesStore();
  const { users, getUsers } = useUsersStore();

  const sortedUsers = [...users].sort((a, b) => b.coins - a.coins);

  useEffect(() => {
    // getSeasons();
    getTracks();
    getRoles();
    getUsers();
  }, []);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'place',
      headerName: 'Місце',
    },
    {
      field: 'nickname',
      headerName: 'Нікнейм',
      width: 200,
    },
    {
      field: 'coins',
      headerName: 'Крихти',
    },
  ];

  const rows = sortedUsers.map((user, index) => {
    return {
      ...user,
      id: user._id,
      place: index + 1,
    };
  });

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Рейтинг крихт</Title>
      </TitleWrapper>

      <RatingFilters />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ width: '80%', alignContent: 'center' }}>
          <CustomTable columns={columns} rows={rows} hideFooterPagination pageSizeOptions={[100]} />
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default CookieRating;
