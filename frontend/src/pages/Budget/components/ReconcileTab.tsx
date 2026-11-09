import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import FactCheckIcon from '@mui/icons-material/FactCheckOutlined';
import { Alert, Button, CircularProgress } from '@mui/material';

import { ConfirmDeleteDialog } from '@/components';
import useBudgetStore from '@/stores/useBudgetStore';
import { RECONCILE_STATUS } from '@/types';
import { notifyFailure } from '@/utils/request';
import { formatDateTime } from '../const/options';
import styles from './Reconcile.module.scss';
import { ReconcileCheckBlock } from './ReconcileCheckBlock';

const SEVERITY = {
  [RECONCILE_STATUS.OK]: 'success',
  [RECONCILE_STATUS.WARNING]: 'warning',
  [RECONCILE_STATUS.ERROR]: 'error',
} as const;

const VERDICT: Record<RECONCILE_STATUS, string> = {
  [RECONCILE_STATUS.OK]: 'Усе сходиться',
  [RECONCILE_STATUS.WARNING]: 'Помилок немає, але є розбіжності, які варто пояснити',
  [RECONCILE_STATUS.ERROR]: 'Є розбіжності, які треба розібрати',
};

export const ReconcileTab: FC = () => {
  const report = useBudgetStore((state) => state.reconcile);
  const isReconciling = useBudgetStore((state) => state.isReconciling);
  const isStale = useBudgetStore((state) => state.isReconcileStale);
  const runReconcile = useBudgetStore((state) => state.runReconcile);
  const writeOpening = useBudgetStore((state) => state.writeOpening);
  const clearReconcile = useBudgetStore((state) => state.clearReconcile);

  const [isOpeningAsked, setIsOpeningAsked] = useState(false);
  const [openingCount, setOpeningCount] = useState(0);
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => clearReconcile, [clearReconcile]);

  const handleRun = () => {
    runReconcile().catch(notifyFailure);
  };

  const handleOpening = async () => {
    if (isWriting) return;

    setIsWriting(true);

    try {
      const { written } = await writeOpening();

      toast.success(
        written.length > 0
          ? `Записано початковий стан: ${written.length}`
          : 'Усі нікнейми вже мають початковий стан',
      );
      await runReconcile();
    } catch (error) {
      notifyFailure(error);
      // Some nicknames may have been written before it failed, and the report should say so
      await runReconcile().catch(() => undefined);
    } finally {
      setIsWriting(false);
      setIsOpeningAsked(false);
    }
  };

  const askOpening = () => {
    setOpeningCount(report?.unaudited.length ?? 0);
    setIsOpeningAsked(true);
  };

  return (
    <div className={styles.section}>
      <div className={styles.intro}>
        Звірка перераховує суми з нуля за записами журналу, аудитом, запитами, крихтами нікнеймів і
        треками та показує, де вони не сходяться. Вона нічого не змінює. Якщо щойно щось змінювали,
        перевірте ще раз.
      </div>

      <div className={styles.toolbar}>
        <Button
          variant="contained"
          startIcon={
            isReconciling ? <CircularProgress size={18} color="inherit" /> : <FactCheckIcon />
          }
          disabled={isReconciling}
          onClick={handleRun}
        >
          {report ? 'Звірити ще раз' : 'Звірити'}
        </Button>
      </div>

      {report && (
        <>
          {isStale && !isReconciling && (
            <Alert severity="warning">
              Після цієї звірки щось змінилося, тому вона вже може не відповідати дійсності. Звірте
              ще раз.
            </Alert>
          )}

          <Alert severity={SEVERITY[report.status]}>
            <strong>{VERDICT[report.status]}.</strong> Перевірено записів журналу:{' '}
            {report.counts.entries}, рядків аудиту: {report.counts.auditRows}, нікнеймів:{' '}
            {report.counts.members}, запитів: {report.counts.requests}.{' '}
            {formatDateTime(report.checkedAt, 'medium')}
          </Alert>

          {report.unaudited.length > 0 && (
            <Alert
              severity="info"
              action={
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ whiteSpace: 'nowrap' }}
                  onClick={askOpening}
                >
                  Записати початковий стан
                </Button>
              }
            >
              Крихти цих нікнеймів ще не під аудитом: {report.unaudited.join(', ')}. Їхній
              початковий стан запишеться при першій зміні, або зараз.
            </Alert>
          )}

          <div className={styles.checks}>
            {report.checks.map((check) => (
              <ReconcileCheckBlock key={check.key} check={check} />
            ))}
          </div>
        </>
      )}

      <ConfirmDeleteDialog
        open={isOpeningAsked}
        title="Записати початковий стан?"
        message={`В аудит додадуться рядки «Початковий стан» для нікнеймів: ${openingCount}. Рядки аудиту не редагуються й не видаляються.`}
        confirmLabel="Записати"
        cancelLabel="Скасувати"
        confirmColor="primary"
        isLoading={isWriting}
        onConfirm={handleOpening}
        onCancel={() => setIsOpeningAsked(false)}
      />
    </div>
  );
};
