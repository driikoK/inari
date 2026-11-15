import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@mui/material';

import { ConfirmDeleteDialog } from '@/components';
import { seasonLabel } from '@/pages/Proposals/const/options';
import useBudgetStore, { type RequestView } from '@/stores/useBudgetStore';
import { REQUEST_STATUS } from '@/types';
import { notifyFailure } from '@/utils/request';
import { expenseKindLabel, formatCrumbs, formatRate, requestDate } from '../const/options';
import { RequestAmount, StatusChip } from './RequestParts';
import { StatCard } from './StatCard';
import cards from './cards.module.scss';
import styles from './Requests.module.scss';

export const MyRequestsTab: FC = () => {
  const withdrawal = useBudgetStore((state) => state.withdrawal);
  const getWithdrawal = useBudgetStore((state) => state.getWithdrawal);
  const cancelRequest = useBudgetStore((state) => state.cancelRequest);

  const [toCancel, setToCancel] = useState<RequestView | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    getWithdrawal().catch(notifyFailure);
  }, [getWithdrawal]);

  const handleCancel = async () => {
    if (!toCancel || isCancelling) return;

    setIsCancelling(true);

    try {
      await cancelRequest(toCancel._id);
      toast.success('Запит скасовано');
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsCancelling(false);
      setToCancel(null);
    }
  };

  if (!withdrawal) return null;

  if (!withdrawal.nickname) {
    return (
      <div className={styles.empty}>
        До вашого акаунта ще не прив’язано нікнейм команди. Попросіть адміна зробити це в
        Налаштуваннях, і тут з’явиться баланс крихт та запити на вивід.
      </div>
    );
  }

  const { requests, shares } = withdrawal;

  return (
    <div className={styles.section}>
      <div className={cards.grid}>
        <StatCard title="Крихт усього" value={formatCrumbs(withdrawal.balance)} />
        <StatCard
          title="Можна вивести зараз"
          value={formatCrumbs(withdrawal.availableCrumbs)}
          hint="Крихти завершених сезонів, які мають коефіцієнт"
        />
        <StatCard
          title="Уже в запитах"
          value={formatCrumbs(withdrawal.reservedCrumbs)}
          hint="Заброньовано, поки запити не виконано"
        />
        <StatCard
          title="Чекають кінця сезону"
          value={formatCrumbs(withdrawal.lockedCrumbs)}
          hint="Поточний сезон і сезони без коефіцієнта"
        />
      </div>

      {shares.length > 0 && (
        <div className={styles.note}>
          Виводяться найстаріші сезони першими:{' '}
          {shares
            .map(
              ({ season, year, crumbs, coefficient }) =>
                `${seasonLabel(season, year)} — ${formatCrumbs(crumbs)} крихт по ${formatRate(coefficient)}`,
            )
            .join('; ')}
          .
        </div>
      )}

      <div className={styles.heading}>Мої запити</div>

      {requests.length === 0 ? (
        <div className={styles.empty}>Запитів ще не було.</div>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Розділ</th>
                <th>Сума</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request._id}
                  className={request.status === REQUEST_STATUS.OPEN ? '' : styles.closed}
                >
                  <td>{requestDate(request.createdAt)}</td>
                  <td>
                    <div>{expenseKindLabel(request.kind)}</div>
                    {request.isOrder && (
                      <div className={styles.sub}>Замовлення: {request.title}</div>
                    )}
                    {request.requisite && (
                      <div className={`${styles.sub} ${styles.requisite}`}>{request.requisite}</div>
                    )}
                    {request.comment && <div className={styles.sub}>«{request.comment}»</div>}
                  </td>
                  <td>
                    <RequestAmount request={request} />
                  </td>
                  <td>
                    <StatusChip status={request.status} />
                    {request.problem && <div className={styles.problem}>{request.problem}</div>}
                    {request.closedBy && request.status !== REQUEST_STATUS.CANCELLED && (
                      <div className={styles.sub}>
                        {requestDate(request.closedAt)} · {request.closedBy}
                      </div>
                    )}
                  </td>
                  <td>
                    {request.status === REQUEST_STATUS.OPEN && (
                      <Button size="small" color="error" onClick={() => setToCancel(request)}>
                        Скасувати
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!toCancel}
        title="Скасувати запит?"
        message="Крихти знову стануть доступними для нового запиту."
        confirmLabel="Скасувати запит"
        cancelLabel="Лишити"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  );
};
