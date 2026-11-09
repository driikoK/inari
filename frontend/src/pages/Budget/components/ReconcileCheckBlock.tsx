import type { FC, ReactElement } from 'react';

import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/WarningAmber';

import type { ReconcileCheck } from '@/stores/useBudgetStore';
import { RECONCILE_STATUS } from '@/types';
import { formatReconcileDifference, formatReconcileValue } from '../const/options';
import styles from './Reconcile.module.scss';

const ICON: Record<RECONCILE_STATUS, ReactElement> = {
  [RECONCILE_STATUS.OK]: <CheckCircleIcon color="success" />,
  [RECONCILE_STATUS.WARNING]: <WarningIcon color="warning" />,
  [RECONCILE_STATUS.ERROR]: <ErrorIcon color="error" />,
};

// The same subject and message can come twice, so the key counts the repeats
const keyedProblems = ({ problems }: ReconcileCheck) => {
  const seen = new Map<string, number>();

  return problems.map((problem) => {
    const base = `${problem.subject}|${problem.message}`;
    const repeat = (seen.get(base) ?? 0) + 1;

    seen.set(base, repeat);

    return { problem, key: `${base}|${repeat}` };
  });
};

export const ReconcileCheckBlock: FC<{ check: ReconcileCheck }> = ({ check }) => {
  const { status, title, description, total, problems } = check;

  return (
    <div className={styles.check}>
      <div className={styles.checkHead}>
        {ICON[status]}
        <div>
          <div className={styles.checkTitle}>{title}</div>
          <div className={styles.sub}>{description}</div>
        </div>
      </div>

      {problems.length > 0 && (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Що</th>
                <th>Розбіжність</th>
                <th className={styles.num}>Очікувано</th>
                <th className={styles.num}>Фактично</th>
                <th className={styles.num}>Різниця</th>
              </tr>
            </thead>
            <tbody>
              {keyedProblems(check).map(({ problem, key }) => (
                <tr
                  key={key}
                  className={problem.severity === RECONCILE_STATUS.WARNING ? styles.warning : ''}
                >
                  <td>{problem.subject}</td>
                  <td>{problem.message}</td>
                  <td className={styles.num}>
                    {formatReconcileValue(problem.unit, problem.expected)}
                  </td>
                  <td className={styles.num}>
                    {formatReconcileValue(problem.unit, problem.actual)}
                  </td>
                  <td className={styles.num}>
                    {formatReconcileDifference(problem.unit, problem.difference)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > problems.length && (
        <div className={styles.more}>
          Показано перші {problems.length} із {total}.
        </div>
      )}
    </div>
  );
};
