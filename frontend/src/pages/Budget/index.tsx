import { FC, useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/AddOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import { Button, CircularProgress, Tab, Tabs } from '@mui/material';

import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import useBudgetStore from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import styles from './Budget.module.scss';
import { AuditTab } from './components/AuditTab';
import { EntriesTab } from './components/EntriesTab';
import { IncomeFormDialog } from './components/IncomeFormDialog';
import { MyRequestsTab } from './components/MyRequestsTab';
import { SummaryCards } from './components/SummaryCards';
import { WithdrawDialog } from './components/WithdrawDialog';

enum TAB {
  OVERVIEW = 'overview',
  REQUESTS = 'requests',
  JOURNAL = 'journal',
  AUDIT = 'audit',
}

const memberTabs = [
  { value: TAB.OVERVIEW, label: 'Огляд' },
  { value: TAB.REQUESTS, label: 'Мої запити' },
];

const adminTabs = [
  { value: TAB.JOURNAL, label: 'Журнал' },
  { value: TAB.AUDIT, label: 'Аудит' },
];

const Budget: FC = () => {
  const summary = useBudgetStore((state) => state.summary);
  const isSummaryLoading = useBudgetStore((state) => state.isSummaryLoading);
  const getSummary = useBudgetStore((state) => state.getSummary);
  const withdrawal = useBudgetStore((state) => state.withdrawal);
  const getWithdrawal = useBudgetStore((state) => state.getWithdrawal);
  const { hasAccess } = usePermissions();
  const canManage = hasAccess(SUBJECTS.MANAGE_BUDGET);

  const [tab, setTab] = useState(TAB.OVERVIEW);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  useEffect(() => {
    getSummary().catch(notifyFailure);
    getWithdrawal().catch(notifyFailure);
  }, [getSummary, getWithdrawal]);

  const tabs = canManage ? [...memberTabs, ...adminTabs] : memberTabs;
  const hasNickname = !!withdrawal?.nickname;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Печивко</div>
          <div className={styles.subtitle}>
            Гроші команди: сезонні банки, надходження та коефіцієнт виводу крихт
          </div>
        </div>

        <div className={styles.buttons}>
          <Button
            startIcon={<PaymentsIcon />}
            variant={canManage ? 'outlined' : 'contained'}
            disabled={!hasNickname || !summary}
            title={hasNickname ? undefined : 'Адмін ще не прив’язав вам нікнейм у Налаштуваннях'}
            onClick={() => setIsWithdrawOpen(true)}
          >
            Вивести крихти
          </Button>

          {canManage && (
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setIsIncomeOpen(true)}
            >
              Внести надходження
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onChange={(_, value: TAB) => setTab(value)}>
        {tabs.map(({ value, label }) => (
          <Tab key={value} value={value} label={label} sx={{ textTransform: 'none' }} />
        ))}
      </Tabs>

      {isSummaryLoading && !summary && <CircularProgress sx={{ alignSelf: 'center' }} />}

      {!isSummaryLoading && !summary && (
        <div className={styles.empty}>
          Не вдалося завантажити суми.
          <Button onClick={() => getSummary().catch(notifyFailure)}>Спробувати ще раз</Button>
        </div>
      )}

      {summary && tab === TAB.OVERVIEW && <SummaryCards summary={summary} />}
      {tab === TAB.REQUESTS && <MyRequestsTab />}
      {summary && canManage && tab === TAB.JOURNAL && <EntriesTab today={summary.today} />}
      {summary && canManage && tab === TAB.AUDIT && <AuditTab today={summary.today} />}

      {isIncomeOpen && <IncomeFormDialog open onClose={() => setIsIncomeOpen(false)} />}
      {isWithdrawOpen && summary && (
        <WithdrawDialog summary={summary} onClose={() => setIsWithdrawOpen(false)} />
      )}
    </div>
  );
};

export default Budget;
