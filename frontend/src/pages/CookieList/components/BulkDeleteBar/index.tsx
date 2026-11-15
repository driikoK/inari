import { FC } from 'react';
import { Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { plural } from '@/utils/plural';
import { Bar, Count } from './styles';

interface BulkDeleteBarProps {
  count: number;
  disabled?: boolean;
  onClear: () => void;
  onDelete: () => void;
}

export const BulkDeleteBar: FC<BulkDeleteBarProps> = ({
  count,
  disabled = false,
  onClear,
  onDelete,
}) => (
  <Bar role="status">
    <Count>
      Вибрано {count} {plural(count, ['запис', 'записи', 'записів'])}
    </Count>
    <Button onClick={onClear} disabled={disabled}>
      Скинути вибір
    </Button>
    <Button
      color="error"
      variant="contained"
      startIcon={<DeleteIcon />}
      onClick={onDelete}
      disabled={disabled}
    >
      Видалити вибрані
    </Button>
  </Bar>
);
