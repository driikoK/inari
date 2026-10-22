import { FC, useState } from 'react';

import { Button, Collapse } from '@mui/material';

import { seasonLabel } from '@/pages/Proposals/const/options';
import type { AuditOperation, AuditRow } from '@/stores/useBudgetStore';
import useRolesStore from '@/stores/useRolesStore';
import { AUDIT_UNIT } from '@/types';
import {
  auditKindLabel,
  describeSnapshot,
  formatCrumbs,
  formatKop,
  formatSignedCrumbs,
  formatSignedKop,
} from '../const/options';
import styles from './AuditOperationCard.module.scss';

interface AuditOperationCardProps {
  operation: AuditOperation;
}

const formatTime = (at: string) =>
  new Date(at).toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'short',
    timeStyle: 'short',
  });

const changedRecords = (rows: AuditRow[]) => [
  ...new Map(
    rows.map((row) => [row.entryId ?? row.subjectKey, { before: row.before, after: row.after }]),
  ).entries(),
];

export const AuditOperationCard: FC<AuditOperationCardProps> = ({ operation }) => {
  const roles = useRolesStore((state) => state.roles);
  const [isOpen, setIsOpen] = useState(false);

  const roleLabel = (role: string) => roles.find(({ value }) => value === role)?.label ?? role;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.top}>
          <span className={styles.kind}>{auditKindLabel(operation.kind)}</span>
          <span className={styles.meta}>
            {formatTime(operation.at)} · {operation.actor}
          </span>
        </div>
        <div className={styles.description}>{operation.description}</div>
      </header>

      <table className={styles.rows}>
        <thead>
          <tr>
            <th>Чия сума, крихти або банка</th>
            <th className={styles.number}>Зміна</th>
            <th className={styles.number}>Залишок після</th>
          </tr>
        </thead>
        <tbody>
          {operation.rows.map((row) =>
            row.unit === AUDIT_UNIT.CRUMBS ? (
              <tr key={row.seq}>
                <td>{row.subjectLabel}</td>
                <td
                  className={`${styles.number} ${row.deltaCrumbs < 0 ? styles.minus : styles.plus}`}
                >
                  {formatSignedCrumbs(row.deltaCrumbs)} крихт
                </td>
                <td className={styles.number}>
                  {formatCrumbs(row.balanceAfterCrumbs)} крихт
                  <div className={styles.sub}>
                    {seasonLabel(row.season, row.year)}:{' '}
                    {formatCrumbs(row.seasonBalanceAfterCrumbs)}
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={row.seq}>
                <td>{row.subjectLabel}</td>
                <td className={`${styles.number} ${row.deltaKop < 0 ? styles.minus : styles.plus}`}>
                  {formatSignedKop(row.deltaKop)}
                </td>
                <td className={styles.number}>{formatKop(row.balanceAfterKop)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>

      <Button
        size="small"
        onClick={() => setIsOpen((open) => !open)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {isOpen ? 'Сховати' : 'Було → стало'}
      </Button>

      <Collapse in={isOpen} unmountOnExit>
        <div className={styles.changes}>
          {changedRecords(operation.rows).map(([entryId, { before, after }]) => (
            <div key={entryId}>
              {before && (
                <div className={styles.was}>Було: {describeSnapshot(before, roleLabel)}</div>
              )}
              {after && (
                <div className={styles.became}>Стало: {describeSnapshot(after, roleLabel)}</div>
              )}
            </div>
          ))}
        </div>
      </Collapse>
    </article>
  );
};
