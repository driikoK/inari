import { FunctionComponent, useEffect } from 'react';

import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import useRolesStore from '@/stores/useRolesStore';
import useMembersStore from '@/stores/useMembersStore';
import { CustomTable } from '@/components/CustomTable';
import { RatingFilters } from './RatingFilters';
import { convertSeasonEngToUkr } from '@/utils/season.utils';

const CookieRating: FunctionComponent = () => {
  const { getRoles } = useRolesStore();
  const { members, getMembers, appliedFilters } = useMembersStore();

  // ** Don't want to mutate the original array
  const sortedMembers = [...members].sort((a, b) => b.coins - a.coins);

  useEffect(() => {
    getRoles();
    getMembers();
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

  const rows = sortedMembers.map((member, index) => {
    const basicInfo = {
      id: member._id,
      place: index + 1,
    };

    if (isYearAndSeasonApplied) {
      return {
        nickname: member.nickname,
        coins: member.seasons.find(
          (season) => season.season === appliedFilters.season && season.year === appliedFilters.year
        )?.coins,
        season: `${convertSeasonEngToUkr(appliedFilters.season!)} ${appliedFilters.year}`,
        ...basicInfo,
      };
    }
    return {
      ...member,
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
        <CustomTable columns={columns} rows={rows} hideFooterPagination pageSizeOptions={[100]} />
      </Box>
    </PageContainer>
  );
};

export default CookieRating;
