import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { Box } from '@mui/material';
import { GridActionsCellItem, GridActionsColDef, GridColDef, GridRowModel } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import { RatingFilters } from './components/RatingFilters';
import { useMembersStore, useRolesStore } from '@/stores';
import { CustomTable, ConfirmTableChangeDialog, ConfirmDeleteDialog } from '@/components';
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
  const { members, getMembers, appliedFilters, updateMember, deleteMember } = useMembersStore();
  const { hasAccess } = usePermissions();

  const [promiseArguments, setPromiseArguments] = useState<any>(null);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; nickname: string } | null>(
    null,
  );

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
      valueFormatter: (value: number | string) => {
        const num = Number(value);

        if (isNaN(num) || num <= 0) return '0';

        return num % 1 === 0 ? num.toString() : num.toFixed(3).toString();
      },
      flex: 0.3,
      editable: hasAccess(SUBJECTS.COOKIES_RATINGS_EDIT) && !isYearAndSeasonApplied ? true : false,
    },
    {
      field: 'updatedAt',
      headerName: 'Оновлено',
      flex: 0.2,
    },
  ];

  const actionsColumn: GridActionsColDef<(typeof rows)[number]> = {
    field: 'actions',
    type: 'actions',
    headerName: 'Дії',
    getActions: ({ row }) => [
      <GridActionsCellItem
        key="delete"
        icon={<DeleteIcon />}
        label="Видалити"
        onClick={() => setMemberToDelete({ id: row.id, nickname: row.nickname })}
        color="inherit"
      />,
    ],
  };

  const dataColumns: GridColDef<(typeof rows)[number]>[] = isYearAndSeasonApplied
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

  const columns: GridColDef<(typeof rows)[number]>[] = [
    ...dataColumns,
    ...(hasAccess(SUBJECTS.DELETE_MEMBERS) ? [actionsColumn] : []),
  ];

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    try {
      await deleteMember(memberToDelete.id);
      toast.success('Нікнейм видалено');
    } catch {
      // The axios interceptor already shows the server's message
    } finally {
      setMemberToDelete(null);
    }
  };

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
          (season) =>
            season.season === appliedFilters.season && season.year === appliedFilters.year,
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
    [],
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

        <ConfirmDeleteDialog
          open={!!memberToDelete}
          title="Видалити нікнейм?"
          message={`Нікнейм «${memberToDelete?.nickname}» зникне зі списку та з вибору учасників. Історія його крихт і треків збережеться, а якщо додати такий нікнейм знову, він повернеться з тими самими крихтами.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setMemberToDelete(null)}
        />
      </Box>
    </PageContainer>
  );
};

export default CookieRating;
