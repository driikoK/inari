import { Paper } from '@mui/material';
import { DataGrid, DataGridProps, GridColDef, GridValidRowModel } from '@mui/x-data-grid';

interface TableProps<T extends GridValidRowModel> extends Omit<DataGridProps, 'rows' | 'columns'> {
  rows: T[];
  columns: GridColDef<T>[];
}

export const CustomTable = <T extends GridValidRowModel>({
  rows,
  columns,
  ...props
}: TableProps<T>) => {
  return (
    <Paper
      sx={{
        width: '100%',
        '& .cell-red': {
          color: 'var(--red)',
          fontWeight: 600,
        },
        '& .cell-green': {
          color: 'var(--green)',
          fontWeight: 600,
        },
        '& .cell-accent': {
          color: 'var(--accent)',
          fontWeight: 600,
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        disableColumnMenu
        disableColumnFilter
        onProcessRowUpdateError={(error) => {
          console.log(error);
        }}
        localeText={{
          MuiTablePagination: {
            labelRowsPerPage: 'Рядків на сторінці',
          },
          checkboxSelectionHeaderName: 'Вибір',
          checkboxSelectionSelectAllRows: 'Вибрати всі рядки сторінки',
          checkboxSelectionUnselectAllRows: 'Зняти вибір зі сторінки',
          checkboxSelectionSelectRow: 'Вибрати рядок',
          checkboxSelectionUnselectRow: 'Зняти вибір з рядка',
        }}
        {...props}
      />
    </Paper>
  );
};
