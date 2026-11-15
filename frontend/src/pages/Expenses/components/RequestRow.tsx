import { FC } from 'react';
import toast from 'react-hot-toast';

import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import { Button, IconButton } from '@mui/material';

import { RequestAmount, StatusChip } from '@/pages/Budget/components/RequestParts';
import styles from '@/pages/Budget/components/Requests.module.scss';
import { digitsOf } from '@/pages/Budget/const/card';
import { expenseKindLabel, requestDate } from '@/pages/Budget/const/options';
import type { RequestView } from '@/stores/useBudgetStore';
import { REQUEST_STATUS } from '@/types';

interface RequestRowProps {
  request: RequestView;
  isOrder: boolean;
  onFulfil: (request: RequestView) => void;
  onReject: (request: RequestView) => void;
}

const copyNumber = async (requisite: string) => {
  try {
    await navigator.clipboard.writeText(digitsOf(requisite));
    toast.success('Скопійовано');
  } catch {
    toast.error('Не вдалося скопіювати');
  }
};

// One line of the queue: what was asked, the card, the sum with what it is made of, and the
// buttons for an open line or the status of a closed one
export const RequestRow: FC<RequestRowProps> = ({ request, isOrder, onFulfil, onReject }) => {
  const isOpen = request.status === REQUEST_STATUS.OPEN;

  return (
    <tr className={isOpen ? '' : styles.closed}>
      <td>{requestDate(request.createdAt)}</td>
      <td>
        <div>{request.nickname}</div>
        <div className={styles.sub}>{request.username}</div>
      </td>
      <td>
        <div>{expenseKindLabel(request.kind)}</div>
        {isOrder && <div className={styles.sub}>{request.title}</div>}
        {request.comment && <div className={styles.sub}>«{request.comment}»</div>}
      </td>
      <td>
        {request.requisite ? (
          <span className={styles.requisite}>
            {request.requisite}
            {isOpen && (
              <IconButton
                size="small"
                aria-label="Скопіювати"
                onClick={() => copyNumber(request.requisite ?? '')}
              >
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            )}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td>
        <RequestAmount request={request} />
        {request.problem && <div className={styles.problem}>{request.problem}</div>}
      </td>
      <td>
        {isOpen ? (
          <div className={styles.actions}>
            <Button size="small" variant="contained" onClick={() => onFulfil(request)}>
              Виконано
            </Button>
            <Button size="small" color="error" onClick={() => onReject(request)}>
              Відхилити
            </Button>
          </div>
        ) : (
          <>
            <StatusChip status={request.status} />
            <div className={styles.sub}>
              {requestDate(request.closedAt)} · {request.closedBy}
            </div>
          </>
        )}
      </td>
    </tr>
  );
};
