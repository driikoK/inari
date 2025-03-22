import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Box } from '@mui/material';
import { GridColDef, GridRowModel } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import { RatingFilters } from './components/RatingFilters';
import { useMembersStore, useRolesStore } from '@/stores';
import { CustomTable, ConfirmTableChangeDialog } from '@/components';
import { convertSeasonEngToUkr } from '@/utils/convert';
import { MemberType } from '@/types';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';
import { prettifyDate } from '@/utils/dates';

function computeMutation(newRow: GridRowModel, oldRow: GridRowModel) {
  if (newRow?.coins !== oldRow?.coins) {
    return `крихт зміниться з '${oldRow?.coins}' на '${newRow?.coins}'`;
  }

  return null;
}

const CookieRating: FunctionComponent = () => {
  const getRoles = useRolesStore((state) => state.getRoles);
  const { members, getMembers, appliedFilters, updateMember } = useMembersStore();
  const { hasAccess } = usePermissions();

  const [promiseArguments, setPromiseArguments] = useState<any>(null);

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
      editable: hasAccess(SUBJECTS.COOKIES_RATINGS_EDIT) && !isYearAndSeasonApplied ? true : false,
    },
    {
      field: 'updatedAt',
      headerName: 'Оновлено',
      flex: 0.2,
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
      updatedAt: prettifyDate(member.updatedAt) || '-',
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

  const processRowUpdate = useCallback(
    (newRow: GridRowModel<MemberType>, oldRow: GridRowModel<MemberType>) =>
      new Promise<GridRowModel<MemberType>>((resolve, reject) => {
        const mutation = computeMutation(newRow, oldRow);

        if (mutation) {
          // ** From docs: save the arguments to resolve or reject the promise later.
          setPromiseArguments({ resolve, reject, newRow, oldRow });
        } else {
          resolve(oldRow);
        }
      }),
    []
  );

  const handleUpdateNo = () => {
    const { oldRow, resolve } = promiseArguments;
    resolve(oldRow);
    setPromiseArguments(null);
  };

  const handleUpdateYes = async () => {
    const { newRow, oldRow, reject, resolve } = promiseArguments;

    try {
      const res = await updateMember({ ...newRow, coins: parseFloat(newRow.coins) });

      resolve({ res, id: res._id });
      setPromiseArguments(null);
      toast.success('Кількість крихт успішно змінено');
    } catch (error) {
      reject(oldRow);
      setPromiseArguments(null);
    }
  };

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
        <CustomTable columns={columns} rows={rows} processRowUpdate={processRowUpdate} />

        <ConfirmTableChangeDialog
          computeMutation={computeMutation}
          handleYes={handleUpdateYes}
          handleNo={handleUpdateNo}
          open={!!promiseArguments}
          row={{ oldRow: promiseArguments?.oldRow, newRow: promiseArguments?.newRow }}
        />
      </Box>
    </PageContainer>
  );
};

export default CookieRating;
