import { FC } from 'react';

import type { RequestView, WithdrawalPart } from '@/stores/useBudgetStore';
import { REQUEST_STATUS } from '@/types';
import { formatCrumbs, formatKop, partText, requestStatusLabel } from '../const/options';
import styles from './Requests.module.scss';

const CHIP: Record<REQUEST_STATUS, string> = {
  [REQUEST_STATUS.OPEN]: styles.chipOpen,
  [REQUEST_STATUS.DONE]: styles.chipDone,
  [REQUEST_STATUS.REJECTED]: styles.chipRejected,
  [REQUEST_STATUS.CANCELLED]: '',
};

export const StatusChip: FC<{ status: REQUEST_STATUS }> = ({ status }) => (
  <span className={`${styles.chip} ${CHIP[status]}`}>{requestStatusLabel[status]}</span>
);

// How the crumbs of a line were or would be paid, season by season
export const Parts: FC<{ parts: WithdrawalPart[] }> = ({ parts }) => (
  <>
    {parts.map((part) => (
      <div key={`${part.year}-${part.season}`} className={styles.sub}>
        {partText(part)}
      </div>
    ))}
  </>
);

// What was asked, and next to it what it is worth: an estimate while the line is open, the
// fixed sum once it is paid
export const RequestAmount: FC<{ request: RequestView }> = ({ request }) => {
  const { isOrder, crumbs, amountKop, status, estimate, paidKop, parts } = request;
  const isOpen = status === REQUEST_STATUS.OPEN;
  const isPaid = status === REQUEST_STATUS.DONE;

  return (
    <>
      <div>{isOrder ? formatKop(amountKop ?? 0) : `${formatCrumbs(crumbs ?? 0)} крихт`}</div>

      {!isOrder && isOpen && estimate && (
        <div className={styles.sub}>≈ {formatKop(estimate.amountKop)} за коефіцієнтами зараз</div>
      )}

      {isPaid && paidKop !== undefined && (
        <div className={styles.sub}>Виплачено {formatKop(paidKop)}</div>
      )}

      {isPaid && parts && <Parts parts={parts} />}
    </>
  );
};
