import { FC, useEffect, useState } from 'react';

import { Tab, Tabs } from '@mui/material';

import { useMembersStore } from '@/stores';
import useBudgetStore from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import styles from './Expenses.module.scss';
import { QueueTab } from './components/QueueTab';
import { TreatForm } from './components/TreatForm';

enum TAB {
  QUEUE = 'queue',
  TREAT = 'treat',
}

const tabs = [
  { value: TAB.QUEUE, label: 'Запити' },
  { value: TAB.TREAT, label: 'Частування' },
];

const Expenses: FC = () => {
  const getSummary = useBudgetStore((state) => state.getSummary);
  const getMembers = useMembersStore((state) => state.getMembers);

  const [tab, setTab] = useState(TAB.QUEUE);

  useEffect(() => {
    getSummary().catch(notifyFailure);
    getMembers().catch(notifyFailure);
  }, [getSummary, getMembers]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Видатки</div>
        <div className={styles.subtitle}>
          Запити учасників на вивід і виплати з бюджету: на карту, донатом або на розвиток команди
        </div>
      </div>

      <Tabs value={tab} onChange={(_, value: TAB) => setTab(value)}>
        {tabs.map(({ value, label }) => (
          <Tab key={value} value={value} label={label} sx={{ textTransform: 'none' }} />
        ))}
      </Tabs>

      {tab === TAB.QUEUE && <QueueTab />}
      {tab === TAB.TREAT && <TreatForm />}
    </div>
  );
};

export default Expenses;
