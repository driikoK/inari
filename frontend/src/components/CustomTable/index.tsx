import { Paper, useTheme } from '@mui/material';
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
  const theme = useTheme();

  return (
    <Paper
      sx={{
        height: '71vh',
        width: '100%',
        '& .cell-red': {
          color: theme.palette.error.main,
          fontWeight: '500',
        },
        '& .cell-green': {
          color: theme.palette.success.light,
          fontWeight: '500',
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
        }}
        {...props}
      />
    </Paper>
  );
};
