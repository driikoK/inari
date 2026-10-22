import { FC, useEffect, useState } from 'react';

import { Tab, Tabs } from '@mui/material';

import { useMembersStore } from '@/stores';
import useBudgetStore from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import styles from './Expenses.module.scss';
import { TreatForm } from './components/TreatForm';

enum TAB {
  TREAT = 'treat',
}

const tabs = [{ value: TAB.TREAT, label: 'Частування' }];

const Expenses: FC = () => {
  const getSummary = useBudgetStore((state) => state.getSummary);
  const getMembers = useMembersStore((state) => state.getMembers);

  const [tab, setTab] = useState(TAB.TREAT);

  useEffect(() => {
    getSummary().catch(notifyFailure);
    getMembers().catch(notifyFailure);
  }, [getSummary, getMembers]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Видатки</div>
        <div className={styles.subtitle}>
          Виплати з бюджету: на карту, донатом або на розвиток команди
        </div>
      </div>

      <Tabs value={tab} onChange={(_, value: TAB) => setTab(value)}>
        {tabs.map(({ value, label }) => (
          <Tab key={value} value={value} label={label} sx={{ textTransform: 'none' }} />
        ))}
      </Tabs>

      {tab === TAB.TREAT && <TreatForm />}
    </div>
  );
};

export default Expenses;
