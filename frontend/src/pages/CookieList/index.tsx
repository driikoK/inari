import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import {
  GridActionsCellItem,
  GridCellParams,
  GridColDef,
  GridRowId,
  GridRowModel,
  GridRowSelectionModel,
} from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from './styles';
import { BulkDeleteBar } from './components/BulkDeleteBar';
import { CookiesFilters } from './components/CookiesFilters';
import {
  useTitlesStore,
  useTracksStore,
  useRolesStore,
  useMembersStore,
  useAuthStore,
} from '@/stores';
import { ANIME_TYPE, TrackType } from '@/types';
import {
  CustomTable,
  ConfirmDeleteDialog,
  ConfirmTableChangeDialog,
  TextWrapTableCell,
} from '@/components';
import { MAX_BULK_DELETE } from '@/utils/constants';
import { convertAnimeTypeEngToUkr, convertSeasonEngToUkr, formatCoins } from '@/utils/convert';
import { prettifyDate } from '@/utils/dates';
import { crumbsWord, plural } from '@/utils/plural';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import { notifyFailure } from '@/utils/request';

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
  isSubsOnly: string;
} & Omit<TrackType, 'isOngoing' | 'isPriority' | 'isInTime' | 'isGuest' | 'isSubsOnly'>;

const trackWord = (count: number) => plural(count, ['трек', 'треки', 'треків']);

const CookieList: FunctionComponent = () => {
  const {
    tracks,
    getTracks,
    deleteTracks,
    deleteTracksBulk,
    updateTrack,
    isLoading,
    appliedFilters,
  } = useTracksStore();
  const titles = useTitlesStore((state) => state.titles);
  const getTitles = useTitlesStore((state) => state.getTitles);
  const { roles, getRoles } = useRolesStore();
  const getMembers = useMembersStore((state) => state.getMembers);
  const { hasAccess } = usePermissions();
  const currentUser = useAuthStore((state) => state.user);

  const [promiseArguments, setPromiseArguments] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RowType | null>(null);
  // What is ticked for a bulk delete stays when the page or the filters change, so it can be more
  // than the table shows
  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const canDelete = hasAccess(SUBJECTS.COOKIES_LIST_DELETE);
  // The page and the filters are one thing in the store, so a filter can send the page back to the
  // first one and the table follows
  const page = appliedFilters.page ?? 1;
  const perPage = appliedFilters.perPage ?? 10;

  // biome-ignore lint/correctness/useExhaustiveDependencies: once, when the page opens, with the filters and the page the store remembers
  useEffect(() => {
    getTitles().catch(notifyFailure);
    getRoles();
    getMembers();
    getTracks({ ...appliedFilters, page, perPage }).catch(notifyFailure);
  }, []);

  // The name of the project as it is now, the one the track was written under when it is gone
  const titleNames = useMemo(
    () => new Map(titles.map(({ _id, ukrName }) => [_id, ukrName])),
    [titles],
  );

  const booleanCell = {
    sortable: false,
    resizable: false,
    cellClassName: (params: GridCellParams<any>) => {
      return params.value === 'Ні' ? 'cell-red' : 'cell-green';
    },
  };

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'nickname',
      headerName: 'Нікнейм',
      width: 200,
    },
    {
      field: 'nameTitle',
      headerName: 'Назва тайтлу',
      width: 400,
      valueGetter: (_, row) => titleNames.get(row.projectId ?? '') ?? row.nameTitle,
    },
    {
      field: 'coins',
      headerName: 'Крихти',
      type: 'number',
      sortable: false,
      editable: hasAccess(SUBJECTS.COOKIES_LIST_UPDATE) ? true : false,
      align: 'left',
      headerAlign: 'left',
      cellClassName: () => 'cell-accent',
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
      width: 170,
    },
    {
      field: 'isOngoing',
      headerName: 'Онґоїнґ',
      ...booleanCell,
    },
    {
      field: 'isPriority',
      headerName: 'Пріоритет',
      ...booleanCell,
    },
    {
      field: 'isInTime',
      headerName: 'Вчасно',
      ...booleanCell,
    },
    {
      field: 'isGuest',
      headerName: 'Гість',
      ...booleanCell,
    },
    {
      field: 'isSubsOnly',
      headerName: 'Лише саби',
      ...booleanCell,
    },
    {
      field: 'username',
      headerName: 'Додав',
      width: 120,
      resizable: false,
    },
    {
      field: 'createdAt',
      headerName: 'Додано',
      width: 120,
      renderCell: (params) => <TextWrapTableCell text={params.value} />,
    },
    {
      field: 'updatedAt',
      headerName: 'Оновлено',
      width: 140,
      renderCell: (params) => <TextWrapTableCell text={params.value} />,
    },
    {
      field: 'note',
      headerName: 'Нотатка',
      sortable: false,
      width: 200,
      resizable: false,
    },
    ...(canDelete
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
      isSubsOnly: formatBoolean(!!track.isSubsOnly),
      username: track.username || '-',
      createdAt: prettifyDate(track.createdAt) || '-',
      updatedAt: prettifyDate(track.updatedAt) || '-',
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
      setSelectedIds((ids) => ids.filter((id) => id !== selectedItem?._id));
      toast.success('Успішно видалено');
    } catch (error) {
    } finally {
      setOpenDeleteDialog(false);
      setSelectedItem(null);
    }
  };

  const handleSelection = (model: GridRowSelectionModel) => {
    if (model.length > MAX_BULK_DELETE) {
      toast.error(`Не більше ${MAX_BULK_DELETE} треків за раз`, { id: 'bulk-delete-limit' });

      return;
    }

    setSelectedIds([...model]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);

    try {
      const { deleted, skipped, coins } = await deleteTracksBulk(selectedIds as string[]);
      const gone = skipped > 0 ? `, ${skipped} ${trackWord(skipped)} уже не було` : '';

      setSelectedIds([]);
      toast.success(
        `Видалено ${deleted} ${trackWord(deleted)}, списано ${formatCoins(coins)} ${crumbsWord(coins)}${gone}`,
      );
    } catch (error) {
      // The server's refusal was shown by the request itself, the selection stays to be changed
      notifyFailure(error);
    } finally {
      setIsBulkDeleting(false);
      setOpenBulkDialog(false);
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
      const res = await updateTrack(newRow._id, {
        coins: newRow.coins,
        username: currentUser!.username,
      });

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

      {canDelete && selectedIds.length > 0 && (
        <BulkDeleteBar
          count={selectedIds.length}
          disabled={isBulkDeleting}
          onClear={() => setSelectedIds([])}
          onDelete={() => setOpenBulkDialog(true)}
        />
      )}

      <CustomTable
        rows={rows}
        columns={columns}
        checkboxSelection={canDelete}
        keepNonExistentRowsSelected
        hideFooterSelectedRowCount
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={handleSelection}
        processRowUpdate={processRowUpdate}
        rowCount={tracks.total}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{ page: page - 1, pageSize: perPage }}
        onPaginationModelChange={(model) =>
          getTracks({
            ...appliedFilters,
            page: model.page + 1,
            perPage: model.pageSize,
          }).catch(notifyFailure)
        }
      />

      <ConfirmTableChangeDialog
        computeMutation={computeMutation}
        handleYes={handleDeleteYes}
        handleNo={handleDeleteNo}
        open={openDeleteDialog}
      />
      <ConfirmDeleteDialog
        open={openBulkDialog}
        title={`Видалити ${selectedIds.length} ${trackWord(selectedIds.length)}?`}
        message="Крихти цих записів буде списано з нікнеймів. Якщо в когось за сезон поточного запису вже менше крихт (їх виведено), не видалиться жоден запис. Видалене можна відновити лише з бекапу."
        isLoading={isBulkDeleting}
        autoFocusCancel
        onConfirm={handleBulkDelete}
        onCancel={() => setOpenBulkDialog(false)}
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
