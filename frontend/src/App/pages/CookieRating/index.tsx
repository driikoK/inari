import { FunctionComponent, useEffect } from 'react';

import { Box, Paper } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import useRolesStore from '@/stores/useRolesStore';
import useUsersStore from '@/stores/useUsersStore';
import { CustomTable } from '@/components/CustomTable';
import { RatingFilters } from './RatingFilters';
import { convertSeasonEngToUkr } from '@/utils/season.utils';

const CookieRating: FunctionComponent = () => {
  const { getRoles } = useRolesStore();
  const { users, getUsers, appliedFilters } = useUsersStore();

  // ** Don't want to mutate the original array
  const sortedUsers = [...users].sort((a, b) => b.coins - a.coins);

  useEffect(() => {
    getRoles();
    getUsers();
  }, []);

  const isYearAndSeasonApplied = !!appliedFilters['year'] && !!appliedFilters['season'];

  const basicColumns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'place',
      headerName: 'Місце',
      flex: 0.1,
    },
    {
      field: 'nickname',
      headerName: 'Нікнейм',
      flex: 0.2,
    },
    {
      field: 'coins',
      headerName: 'Крихти',
      flex: 0.3,
    },
  ];

  const columns: GridColDef<(typeof rows)[number]>[] = isYearAndSeasonApplied
    ? [
        ...basicColumns,
        {
          field: 'season',
          headerName: 'Сезон',
          flex: 0.3,
          sortable: false,
        },
      ]
    : basicColumns;

  const rows = sortedUsers.map((user, index) => {
    const basicInfo = {
      id: user._id,
      place: index + 1,
    };

    if (isYearAndSeasonApplied) {
      return {
        nickname: user.nickname,
        coins: user.seasons.find(
          (season) => season.season === appliedFilters.season && season.year === appliedFilters.year
        )?.coins,
        season: `${convertSeasonEngToUkr(appliedFilters.season!)} ${appliedFilters.year}`,
        ...basicInfo,
      };
    }
    return {
      ...user,
      ...basicInfo,
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
        <Paper sx={{ height: '69vh', width: '100%' }}>
          <CustomTable columns={columns} rows={rows} hideFooterPagination pageSizeOptions={[100]} />
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default CookieRating;
