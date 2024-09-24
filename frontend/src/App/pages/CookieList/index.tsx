import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { GridActionsCellItem, GridColDef, GridRowModel } from '@mui/x-data-grid';
import toast from 'react-hot-toast';

import { Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { PageContainer, Title, TitleWrapper } from './styles';
import useSeasonsStore from '@/stores/useSeasons';
import useTracksStore from '@/stores/useTracksStore';
import useAnimeStore from '@/stores/useAnimeStore';
import useRolesStore from '@/stores/useRolesStore';
import useUsersStore from '@/stores/useUsersStore';
import { TrackType } from '@/types';
import { CustomTable } from '@/components/CustomTable';
import { CookiesFilters } from './CookiesFilters';
import { ConfirmTableChangeDialog } from '@/App/dialogs/ConfirmTableChangeDialog';
import { convertAnimeTypeEngToUkr, convertSeasonEngToUkr } from '@/utils/season.utils';

function computeMutation(newRow: GridRowModel, oldRow: GridRowModel) {
  if (newRow?.coins !== oldRow?.coins) {
    return `крихт зміниться з '${oldRow?.coins}' на '${newRow?.coins}'`;
  }

  return null;
}

type RowType = {
  isFast: string;
  isOngoing: string;
  isPriority: string;
  isInTime: string;
} & Omit<TrackType, 'isFast' | 'isOngoing' | 'isPriority' | 'isInTime'>;

const CookieList: FunctionComponent = () => {
  const { getSeasons } = useSeasonsStore();
  const { tracks, getTracks, deleteTracks, updateTrack } = useTracksStore();
  const { getAnime } = useAnimeStore();
  const { roles, getRoles } = useRolesStore();
  const { getUsers } = useUsersStore();

  useEffect(() => {
    getSeasons();
    getTracks();
    getAnime();
    getRoles();
    getUsers();
  }, []);

  const [promiseArguments, setPromiseArguments] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RowType | null>(null);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'nickname',
      headerName: 'Нікнейм',
      flex: 0.5,
    },
    {
      field: 'nameTitle',
      headerName: 'Назва тайтлу',
      flex: 1,
    },
    {
      field: 'coins',
      headerName: 'Крихти',
      type: 'number',
      flex: 0.3,
      sortable: false,
      editable: true,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'currentEpisode',
      headerName: 'Епізод',
      sortable: false,
      flex: 0.3,
      resizable: false,
    },
    {
      field: 'typeRole',
      headerName: 'Роль',
      sortable: false,
      flex: 0.5,
      resizable: false,
    },
    {
      field: 'season',
      headerName: 'Сезон',
      sortable: false,
      resizable: false,
      flex: 0.4,
    },
    {
      field: 'titleType',
      headerName: 'Тип',
      sortable: false,
      resizable: false,
      flex: 0.4,
    },
    {
      field: 'isFast',
      headerName: 'Швидко',
      sortable: false,
      resizable: false,
      flex: 0.4,
    },
    {
      field: 'isOngoing',
      headerName: 'Онґоїнґ',
      sortable: false,
      resizable: false,
      flex: 0.4,
    },
    {
      field: 'isPriority',
      headerName: 'Пріоритет',
      sortable: false,
      resizable: false,
      flex: 0.4,
    },
    {
      field: 'isInTime',
      headerName: 'Вчасно',
      sortable: false,
      resizable: false,
      flex: 0.4,
    },
    {
      field: 'note',
      headerName: 'Нотатка',
      sortable: false,
      flex: 0.5,
      resizable: false,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Дії',
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
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
  ];

  const rows: RowType[] = tracks.map((track) => {
    return {
      ...track,
      id: track._id,
      typeRole: roles.find((role) => role.value === track.typeRole)?.label || '',
      note: track.note || '-',
      season: `${convertSeasonEngToUkr(track.season)} ${track.year}`,
      titleType: convertAnimeTypeEngToUkr(track.titleType),
      isFast: track.isFast ? 'Так' : 'Ні',
      isInTime: track.isInTime ? 'Так' : 'Ні',
      isOngoing: track.isOngoing ? 'Так' : 'Ні',
      isPriority: track.isPriority ? 'Так' : 'Ні',
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
      toast.success('Збережено');
    } catch (error) {
      toast.error('Сталася помилка');
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
      toast.success('Збережено');
    } catch (error) {
      toast.error('Сталася помилка');
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

      <Paper sx={{ height: '69vh', width: '100%' }}>
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

        <CustomTable rows={rows} columns={columns} processRowUpdate={processRowUpdate} />
      </Paper>
    </PageContainer>
  );
};

export default CookieList;
