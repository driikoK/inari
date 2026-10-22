import { FC, useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, CircularProgress, Tab, Tabs } from '@mui/material';

import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import useBudgetStore from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import styles from './Budget.module.scss';
import { AuditTab } from './components/AuditTab';
import { EntriesTab } from './components/EntriesTab';
import { IncomeFormDialog } from './components/IncomeFormDialog';
import { SummaryCards } from './components/SummaryCards';

enum TAB {
  OVERVIEW = 'overview',
  JOURNAL = 'journal',
  AUDIT = 'audit',
}

const tabs = [
  { value: TAB.OVERVIEW, label: 'Огляд' },
  { value: TAB.JOURNAL, label: 'Журнал' },
  { value: TAB.AUDIT, label: 'Аудит' },
];

const Budget: FC = () => {
  const summary = useBudgetStore((state) => state.summary);
  const isSummaryLoading = useBudgetStore((state) => state.isSummaryLoading);
  const getSummary = useBudgetStore((state) => state.getSummary);
  const { hasAccess } = usePermissions();
  const canManage = hasAccess(SUBJECTS.MANAGE_BUDGET);

  const [tab, setTab] = useState(TAB.OVERVIEW);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);

  useEffect(() => {
    getSummary().catch(notifyFailure);
  }, [getSummary]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Печивко</div>
          <div className={styles.subtitle}>
            Гроші команди: сезонні банки, надходження та коефіцієнт виводу крихт
          </div>
        </div>

        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setIsIncomeOpen(true)}>
            Внести надходження
          </Button>
        )}
      </div>

      {canManage && (
        <Tabs value={tab} onChange={(_, value: TAB) => setTab(value)}>
          {tabs.map(({ value, label }) => (
            <Tab key={value} value={value} label={label} sx={{ textTransform: 'none' }} />
          ))}
        </Tabs>
      )}

      {isSummaryLoading && !summary && <CircularProgress sx={{ alignSelf: 'center' }} />}

      {!isSummaryLoading && !summary && (
        <div className={styles.empty}>
          Не вдалося завантажити суми.
          <Button onClick={() => getSummary().catch(notifyFailure)}>Спробувати ще раз</Button>
        </div>
      )}

      {summary && tab === TAB.OVERVIEW && <SummaryCards summary={summary} />}
      {summary && canManage && tab === TAB.JOURNAL && <EntriesTab today={summary.today} />}
      {summary && canManage && tab === TAB.AUDIT && <AuditTab today={summary.today} />}

      {isIncomeOpen && <IncomeFormDialog open onClose={() => setIsIncomeOpen(false)} />}
    </div>
  );
};

export default Budget;
