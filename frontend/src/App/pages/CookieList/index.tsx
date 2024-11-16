import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { GridActionsCellItem, GridCellParams, GridColDef, GridRowModel } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import { CookiesFilters } from './CookiesFilters';
import useTracksStore from '@/stores/useTracksStore';
import useAnimeStore from '@/stores/useAnimeStore';
import useRolesStore from '@/stores/useRolesStore';
import useMembersStore from '@/stores/useMembersStore';
import { ANIME_TYPE, TrackType } from '@/types';
import { CustomTable } from '@/components/CustomTable';
import { ConfirmTableChangeDialog } from '@/App/dialogs/ConfirmTableChangeDialog';
import { convertAnimeTypeEngToUkr, convertSeasonEngToUkr } from '@/utils/season.utils';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks/usePermissions';

function computeMutation(newRow: GridRowModel, oldRow: GridRowModel) {
  if (newRow?.coins !== oldRow?.coins) {
    return `крихт зміниться з '${oldRow?.coins}' на '${newRow?.coins}' + множники`;
  }

  return null;
}

type RowType = {
  isOngoing: string;
  isPriority: string;
  isInTime: string;
  isGuest: string;
} & Omit<TrackType, 'isOngoing' | 'isPriority' | 'isInTime' | 'isGuest'>;

const CookieList: FunctionComponent = () => {
  const { tracks, getTracks, deleteTracks, updateTrack, isLoading, appliedFilters } =
    useTracksStore();
  const { getAnime } = useAnimeStore();
  const { roles, getRoles } = useRolesStore();
  const { getMembers } = useMembersStore();
  const { hasAccess } = usePermissions();

  const [promiseArguments, setPromiseArguments] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RowType | null>(null);
  // ** From docs https://mui.com/x/react-data-grid/pagination/
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  useEffect(() => {
    getAnime();
    getRoles();
    getMembers();
  }, []);

  useEffect(() => {
    getTracks({
      ...appliedFilters,
      page: paginationModel.page + 1,
      perPage: paginationModel.pageSize,
    });
  }, [paginationModel]);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'nickname',
      headerName: 'Нікнейм',
      width: 300,
    },
    {
      field: 'nameTitle',
      headerName: 'Назва тайтлу',
      width: 400,
    },
    {
      field: 'coins',
      headerName: 'Крихти',
      type: 'number',
      sortable: false,
      editable: hasAccess(SUBJECTS.COOKIES_LIST_UPDATE) ? true : false,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'currentEpisode',
      headerName: 'Епізод',
      sortable: false,
      resizable: false,
    },
    {
      field: 'typeRole',
      headerName: 'Роль',
      sortable: false,
      width: 170,
      resizable: false,
    },
    {
      field: 'season',
      headerName: 'Сезон',
      sortable: false,
      resizable: false,
      width: 120,
    },
    {
      field: 'titleType',
      headerName: 'Тип',
      sortable: false,
      resizable: false,
      width: 150,
    },
    {
      field: 'isOngoing',
      headerName: 'Онґоїнґ',
      sortable: false,
      resizable: false,
      cellClassName: (params: GridCellParams<any>) => {
        return params.value === 'Ні' ? 'cell-red' : 'cell-green';
      },
    },
    {
      field: 'isPriority',
      headerName: 'Пріоритет',
      sortable: false,
      resizable: false,
      cellClassName: (params: GridCellParams<any>) => {
        return params.value === 'Ні' ? 'cell-red' : 'cell-green';
      },
    },
    {
      field: 'isInTime',
      headerName: 'Вчасно',
      sortable: false,
      resizable: false,
      cellClassName: (params: GridCellParams<any>) => {
        return params.value === 'Ні' ? 'cell-red' : 'cell-green';
      },
    },
    {
      field: 'isGuest',
      headerName: 'Гість',
      sortable: false,
      resizable: false,
      cellClassName: (params: GridCellParams<any>) => {
        return params.value === 'Ні' ? 'cell-red' : 'cell-green';
      },
    },
    {
      field: 'note',
      headerName: 'Нотатка',
      sortable: false,
      width: 200,
      resizable: false,
    },
    {
      field: 'username',
      headerName: 'Додав',
      width: 120,
      resizable: false,
    },
    ...(hasAccess(SUBJECTS.COOKIES_LIST_DELETE)
      ? [
          {
            field: 'actions',
            type: 'actions',
            headerName: 'Дії',
            getActions: ({ id, row }: { id: string; row: RowType }) => {
              return [
                <GridActionsCellItem
                  icon={<DeleteIcon />}
                  label="Delete"
                  onClick={() => handleDeleteClick(row)}
                  color="inherit"
                />,
              ];
            },
          },
        ]
      : ([] as any)),
  ];

  const formatBoolean = (value: boolean) => (value ? 'Так' : 'Ні');

  const rows: RowType[] = tracks.data.map((track) => {
    return {
      ...track,
      id: track._id,
      typeRole: roles.find((role) => role.value === track.typeRole)?.label || '',
      note: track.note || '-',
      season: `${convertSeasonEngToUkr(track.season)} ${track.year}`,
      titleType: convertAnimeTypeEngToUkr(track.titleType as ANIME_TYPE),
      isInTime: formatBoolean(track.isInTime),
      isOngoing: formatBoolean(track.isOngoing),
      isPriority: formatBoolean(track.isPriority),
      isGuest: formatBoolean(track.isGuest),
      username: track.username || '-',
    };
  });

  const handleDeleteClick = async (item: RowType) => {
    setOpenDeleteDialog(true);
    setSelectedItem(item);
  };

  const handleDeleteNo = () => {
    setOpenDeleteDialog(false);
    setSelectedItem(null);
  };

  const handleDeleteYes = async () => {
    try {
      await deleteTracks(selectedItem?._id as string);
      toast.success('Успішно видалено');
    } catch (error) {
    } finally {
      setOpenDeleteDialog(false);
      setSelectedItem(null);
    }
  };

  const processRowUpdate = useCallback(
    (newRow: GridRowModel<TrackType>, oldRow: GridRowModel<TrackType>) =>
      new Promise<GridRowModel<TrackType>>((resolve, reject) => {
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
      const res = await updateTrack(newRow._id, { coins: newRow.coins });

      resolve({ res, id: res._id });
      setPromiseArguments(null);
      toast.success('Успішно змінено');
    } catch (error) {
      reject(oldRow);
      setPromiseArguments(null);
    }
  };

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Список крихт</Title>
      </TitleWrapper>

      <CookiesFilters />

      <CustomTable
        rows={rows}
        columns={columns}
        processRowUpdate={processRowUpdate}
        rowCount={tracks.total}
        loading={isLoading}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
      />

      <ConfirmTableChangeDialog
        computeMutation={computeMutation}
        handleYes={handleDeleteYes}
        handleNo={handleDeleteNo}
        open={openDeleteDialog}
      />
      <ConfirmTableChangeDialog
        computeMutation={computeMutation}
        handleYes={handleUpdateYes}
        handleNo={handleUpdateNo}
        open={!!promiseArguments}
        row={{ oldRow: promiseArguments?.oldRow, newRow: promiseArguments?.newRow }}
      />
    </PageContainer>
  );
};

export default CookieList;
