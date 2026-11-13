import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { CircularProgress, Pagination } from '@mui/material';

import { ConfirmDeleteDialog } from '@/components';
import styles from '@/pages/Budget/components/Requests.module.scss';
import useBudgetStore, { type RequestGroup, type RequestView } from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import { FulfilDialog } from './FulfilDialog';
import { RequestRow } from './RequestRow';

interface RequestTableProps {
  title: string;
  empty: string;
  isOrder: boolean;
  group: RequestGroup;
  onPage: (page: number) => void;
  onFulfil: (request: RequestView) => void;
  onReject: (request: RequestView) => void;
}

// Every open line comes first, as they are the work, then the closed ones of the last two
// seasons ten to a page, newest closed first
const RequestTable: FC<RequestTableProps> = ({
  title,
  empty,
  isOrder,
  group,
  onPage,
  onFulfil,
  onReject,
}) => {
  const { open, closed } = group;
  const pages = Math.ceil(closed.total / closed.perPage);

  // A page that has nothing on it any more, after its lines were dropped from the list
  useEffect(() => {
    if (closed.data.length === 0 && closed.page > 1) onPage(Math.max(pages, 1));
  }, [closed.data.length, closed.page, pages, onPage]);

  if (open.length === 0 && closed.total === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.heading}>{title}</div>
        <div className={styles.empty}>{empty}</div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.heading}>{title}</div>

      {open.length === 0 && <div className={styles.empty}>Відкритих запитів немає.</div>}

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
            {open.map((request) => (
              <RequestRow
                key={request._id}
                request={request}
                isOrder={isOrder}
                onFulfil={onFulfil}
                onReject={onReject}
              />
            ))}

            {closed.data.length > 0 && (
              <tr className={styles.divider}>
                <td colSpan={6}>Закриті за поточний і попередній сезони: {closed.total}</td>
              </tr>
            )}

            {closed.data.map((request) => (
              <RequestRow
                key={request._id}
                request={request}
                isOrder={isOrder}
                onFulfil={onFulfil}
                onReject={onReject}
              />
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <Pagination
          count={pages}
          page={closed.page}
          onChange={(_, value) => onPage(value)}
          sx={{ alignSelf: 'center' }}
        />
      )}
    </div>
  );
};

export const QueueTab: FC = () => {
  const queue = useBudgetStore((state) => state.queue);
  const getQueue = useBudgetStore((state) => state.getQueue);
  const clearQueue = useBudgetStore((state) => state.clearQueue);
  const rejectRequest = useBudgetStore((state) => state.rejectRequest);

  const [crumbsPage, setCrumbsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [toFulfil, setToFulfil] = useState<RequestView | null>(null);
  const [toReject, setToReject] = useState<RequestView | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    getQueue({ crumbsPage, ordersPage }).catch(notifyFailure);
  }, [getQueue, crumbsPage, ordersPage]);

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
        group={queue.crumbs}
        onPage={setCrumbsPage}
        onFulfil={setToFulfil}
        onReject={setToReject}
      />

      <RequestTable
        title="Запити на тістечка"
        empty="Запитів за замовлення немає."
        isOrder
        group={queue.orders}
        onPage={setOrdersPage}
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
