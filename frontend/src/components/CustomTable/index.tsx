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
      pageSizeOptions={[10]}
      disableRowSelectionOnClick
      disableColumnMenu
      disableColumnFilter
      onProcessRowUpdateError={(error) => {
        console.log(error);
      }}
      {...props}
    />
  );
};
