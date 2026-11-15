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
import { ENTRY_TYPE, EXPENSE_SECTION } from '@/types';
import { notifyFailure } from '@/utils/request';
import {
  entryDetails,
  entryKindLabel,
  entryTypeOptions,
  formatEntryAmount,
  recentSeasons,
  seasonKey,
} from '../const/options';
import { ExpenseEditDialog } from './ExpenseEditDialog';
import { IncomeFormDialog } from './IncomeFormDialog';

interface EntriesTabProps {
  today: string;
}

const ALL_SEASONS = 'all';
const ALL_TYPES = 'all';

const DELETE_TEXT: Record<ENTRY_TYPE, { title: string; message: string; done: string }> = {
  [ENTRY_TYPE.INCOME]: {
    title: 'Видалити надходження?',
    message:
      'Надходження зникне із суми й журналу, але в аудиті лишиться запис про видалення. Цю дію не можна скасувати.',
    done: 'Надходження видалено',
  },
  [ENTRY_TYPE.ALLOCATION]: {
    title: 'Видалити виділення?',
    message:
      'Гроші повернуться з напрямку в банку сезону, а в аудиті лишиться запис про видалення. Цю дію не можна скасувати.',
    done: 'Виділення видалено',
  },
  [ENTRY_TYPE.EXPENSE]: {
    title: 'Видалити частування?',
    message:
      'Гроші повернуться в розділ бюджету, з якого їх виплатили, а в аудиті лишиться запис про видалення. Цю дію не можна скасувати.',
    done: 'Частування видалено',
  },
};

// The crumbs of a payout have already left the nickname, so the journal cannot change it
const isLockedEntry = (entry: BudgetEntry) =>
  entry.type === ENTRY_TYPE.EXPENSE && entry.section === EXPENSE_SECTION.CRUMBS;

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

    setParams(({ perPage, type }) => ({
      page: 1,
      perPage,
      ...(type && { type }),
      ...(picked && { season: picked.season, year: picked.year }),
    }));
  };

  const handleTypeFilter = (value: string) => {
    setParams(({ perPage, season, year }) => ({
      page: 1,
      perPage,
      ...(season && year && { season, year }),
      ...(value !== ALL_TYPES && { type: value as ENTRY_TYPE }),
    }));
  };

  const deleteText = DELETE_TEXT[entryToDelete?.type ?? ENTRY_TYPE.INCOME];

  const handleDelete = async () => {
    if (!entryToDelete || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteEntry(entryToDelete._id);
      toast.success(deleteText.done);
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
      width: 110,
      valueFormatter: (value: string) => formatDay(value),
    },
    {
      field: 'season',
      headerName: 'Сезон',
      width: 110,
      sortable: false,
      valueGetter: (_, row) => seasonLabel(row.season, row.year),
    },
    {
      field: 'kind',
      headerName: 'Запис',
      width: 200,
      sortable: false,
      valueGetter: (_, row) => entryKindLabel(row),
    },
    {
      field: 'amountKop',
      headerName: 'Сума',
      width: 130,
      sortable: false,
      valueGetter: (_, row) => formatEntryAmount(row),
    },
    {
      field: 'details',
      headerName: 'Тайтл / ім’я / напрямок',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_, row) => entryDetails(row),
    },
    { field: 'createdBy', headerName: 'Додав', width: 100, sortable: false },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Дії',
      width: 90,
      getActions: ({ row }) =>
        isLockedEntry(row)
          ? []
          : [
              ...(row.type === ENTRY_TYPE.ALLOCATION
                ? []
                : [
                    <GridActionsCellItem
                      key="edit"
                      icon={<EditIcon />}
                      label="Редагувати"
                      onClick={() => setEntryToEdit(row)}
                      color="inherit"
                    />,
                  ]),
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
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

        <TextField
          select
          size="small"
          label="Тип запису"
          value={params.type ?? ALL_TYPES}
          onChange={(event) => handleTypeFilter(event.target.value)}
          sx={{ width: 240 }}
        >
          <MenuItem value={ALL_TYPES}>Усі записи</MenuItem>
          {entryTypeOptions.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

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

      {entryToEdit?.type === ENTRY_TYPE.INCOME && (
        <IncomeFormDialog open entry={entryToEdit} onClose={() => setEntryToEdit(null)} />
      )}

      {entryToEdit?.type === ENTRY_TYPE.EXPENSE && (
        <ExpenseEditDialog entry={entryToEdit} onClose={() => setEntryToEdit(null)} />
      )}

      <ConfirmDeleteDialog
        open={!!entryToDelete}
        isLoading={isDeleting}
        title={deleteText.title}
        message={deleteText.message}
        onConfirm={handleDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </Box>
  );
};
