import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { Box, MenuItem, TextField } from '@mui/material';

import { ConfirmDeleteDialog, CustomTable } from '@/components';
import { formatDay } from '@/pages/Projects/const/options';
import { seasonLabel } from '@/pages/Proposals/const/options';
import useBudgetStore, { type BudgetEntry, type EntriesParams } from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import { formatKop, recentSeasons, seasonKey, sourceLabel } from '../const/options';
import { IncomeFormDialog } from './IncomeFormDialog';

interface EntriesTabProps {
  today: string;
}

const ALL_SEASONS = 'all';

export const EntriesTab: FC<EntriesTabProps> = ({ today }) => {
  const entries = useBudgetStore((state) => state.entries);
  const getEntries = useBudgetStore((state) => state.getEntries);
  const clearEntries = useBudgetStore((state) => state.clearEntries);
  const deleteEntry = useBudgetStore((state) => state.deleteEntry);

  const [params, setParams] = useState<EntriesParams>({ page: 1, perPage: 25 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<BudgetEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<BudgetEntry | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getEntries(params)
      .catch(notifyFailure)
      .finally(() => setIsLoading(false));
  }, [params, getEntries]);

  useEffect(() => clearEntries, [clearEntries]);

  const seasons = recentSeasons(today);
  const filterValue =
    params.season && params.year ? seasonKey(params.season, params.year) : ALL_SEASONS;

  const handleSeasonFilter = (value: string) => {
    const picked = seasons.find(({ season, year }) => seasonKey(season, year) === value);

    setParams(({ perPage }) => ({
      page: 1,
      perPage,
      ...(picked && { season: picked.season, year: picked.year }),
    }));
  };

  const handleDelete = async () => {
    if (!entryToDelete || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteEntry(entryToDelete._id);
      toast.success('Надходження видалено');
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  };

  const columns: GridColDef<BudgetEntry>[] = [
    {
      field: 'date',
      headerName: 'Дата',
      width: 120,
      valueFormatter: (value: string) => formatDay(value),
    },
    {
      field: 'season',
      headerName: 'Сезон',
      width: 130,
      sortable: false,
      valueGetter: (_, row) => seasonLabel(row.season, row.year),
    },
    {
      field: 'source',
      headerName: 'Джерело',
      width: 160,
      sortable: false,
      valueGetter: (_, row) => sourceLabel(row.source),
    },
    {
      field: 'amountKop',
      headerName: 'Сума',
      width: 140,
      sortable: false,
      valueFormatter: (value: number) => formatKop(value),
    },
    {
      field: 'details',
      headerName: 'Тайтл / ім’я',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => row.title ?? row.nickname ?? '—',
    },
    { field: 'createdBy', headerName: 'Додав', width: 140, sortable: false },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Дії',
      width: 110,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Редагувати"
          onClick={() => setEntryToEdit(row)}
          color="inherit"
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Видалити"
          onClick={() => setEntryToDelete(row)}
          color="inherit"
        />,
      ],
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        select
        size="small"
        label="Сезон"
        value={filterValue}
        onChange={(event) => handleSeasonFilter(event.target.value)}
        sx={{ width: 200 }}
      >
        <MenuItem value={ALL_SEASONS}>Усі сезони</MenuItem>
        {seasons.map(({ season, year }) => (
          <MenuItem key={seasonKey(season, year)} value={seasonKey(season, year)}>
            {seasonLabel(season, year)}
          </MenuItem>
        ))}
      </TextField>

      <CustomTable
        rows={(entries?.data ?? []).map((entry) => ({ ...entry, id: entry._id }))}
        columns={columns}
        loading={isLoading}
        paginationMode="server"
        rowCount={entries?.total ?? 0}
        paginationModel={{ page: params.page - 1, pageSize: params.perPage }}
        onPaginationModelChange={({ page, pageSize }) =>
          setParams((previous) => ({ ...previous, page: page + 1, perPage: pageSize }))
        }
        disableColumnSorting
      />

      {entryToEdit && (
        <IncomeFormDialog open entry={entryToEdit} onClose={() => setEntryToEdit(null)} />
      )}

      <ConfirmDeleteDialog
        open={!!entryToDelete}
        isLoading={isDeleting}
        title="Видалити надходження?"
        message="Надходження зникне із суми й журналу, але в аудиті лишиться запис про видалення. Цю дію не можна скасувати."
        onConfirm={handleDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </Box>
  );
};
