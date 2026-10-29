import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import { Button, CircularProgress, IconButton } from '@mui/material';

import { ConfirmDeleteDialog } from '@/components';
import { RequestAmount, StatusChip } from '@/pages/Budget/components/RequestParts';
import styles from '@/pages/Budget/components/Requests.module.scss';
import { digitsOf } from '@/pages/Budget/const/card';
import { expenseKindLabel, requestDate } from '@/pages/Budget/const/options';
import useBudgetStore, { type RequestView } from '@/stores/useBudgetStore';
import { REQUEST_STATUS } from '@/types';
import { notifyFailure } from '@/utils/request';
import { FulfilDialog } from './FulfilDialog';

interface RequestTableProps {
  title: string;
  empty: string;
  isOrder: boolean;
  requests: RequestView[];
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

const RequestTable: FC<RequestTableProps> = ({
  title,
  empty,
  isOrder,
  requests,
  onFulfil,
  onReject,
}) => (
  <div className={styles.section}>
    <div className={styles.heading}>{title}</div>

    {requests.length === 0 ? (
      <div className={styles.empty}>{empty}</div>
    ) : (
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Учасник</th>
              <th>{isOrder ? 'Тайтл і розділ' : 'Розділ'}</th>
              <th>Реквізит</th>
              <th>Сума</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const isOpen = request.status === REQUEST_STATUS.OPEN;

              return (
                <tr key={request._id} className={isOpen ? '' : styles.closed}>
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
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export const QueueTab: FC = () => {
  const queue = useBudgetStore((state) => state.queue);
  const getQueue = useBudgetStore((state) => state.getQueue);
  const clearQueue = useBudgetStore((state) => state.clearQueue);
  const rejectRequest = useBudgetStore((state) => state.rejectRequest);

  const [toFulfil, setToFulfil] = useState<RequestView | null>(null);
  const [toReject, setToReject] = useState<RequestView | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    getQueue().catch(notifyFailure);
  }, [getQueue]);

  useEffect(() => clearQueue, [clearQueue]);

  const handleReject = async () => {
    if (!toReject || isRejecting) return;

    setIsRejecting(true);

    try {
      await rejectRequest(toReject._id);
      toast.success('Запит відхилено');
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsRejecting(false);
      setToReject(null);
    }
  };

  if (!queue) return <CircularProgress sx={{ alignSelf: 'center' }} />;

  return (
    <>
      <RequestTable
        title="Запити на печиво"
        empty="Запитів на крихти немає."
        isOrder={false}
        requests={queue.filter(({ isOrder }) => !isOrder)}
        onFulfil={setToFulfil}
        onReject={setToReject}
      />

      <RequestTable
        title="Запити на тістечка"
        empty="Запитів за замовлення немає."
        isOrder
        requests={queue.filter(({ isOrder }) => isOrder)}
        onFulfil={setToFulfil}
        onReject={setToReject}
      />

      {toFulfil && <FulfilDialog request={toFulfil} onClose={() => setToFulfil(null)} />}

      <ConfirmDeleteDialog
        open={!!toReject}
        title="Відхилити запит?"
        message="Рядок закриється без виплати, а крихти учасника знову стануть доступними."
        confirmLabel="Відхилити"
        cancelLabel="Лишити"
        isLoading={isRejecting}
        onConfirm={handleReject}
        onCancel={() => setToReject(null)}
      />
    </>
  );
};
