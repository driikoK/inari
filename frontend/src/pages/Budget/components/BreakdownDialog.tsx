import { FC } from 'react';

import { Button } from '@mui/material';

import { CustomDialog, H6 } from '@/components';
import { seasonLabel } from '@/pages/Proposals/const/options';
import type { BudgetSeasonSummary, BudgetSummary } from '@/stores/useBudgetStore';
import {
  directionLabel,
  formatCoefficient,
  formatKop,
  formatSignedKop,
  sourceLabel,
} from '../const/options';
import styles from './Breakdown.module.scss';
import { BreakdownTable, type BreakdownRow } from './BreakdownTable';

export type BreakdownKind = 'jar' | 'support' | 'orders' | 'treats' | 'lisodari';

interface BreakdownDialogProps {
  kind: BreakdownKind;
  summary: BudgetSummary;
  season?: BudgetSeasonSummary;
  canManage: boolean;
  onClose: () => void;
  onManageSupport: () => void;
}

const jarContent = (season: BudgetSeasonSummary) => {
  const rows: BreakdownRow[] = [
    ...season.sources.map(({ source, kop }) => ({
      key: source,
      cells: [sourceLabel(source), formatSignedKop(kop)],
    })),
    ...(season.transfersKop > 0
      ? [
          {
            key: 'transfers',
            cells: ['Перекази на розвиток команди', formatSignedKop(season.transfersKop)],
          },
        ]
      : []),
    { key: 'support', cells: ['Печивко підтримки', formatSignedKop(-season.supportKop)] },
    {
      key: 'orders',
      cells: ['Тістечка замовлень (90% замовлень)', formatSignedKop(-season.ordersKop)],
    },
    { key: 'payouts', cells: ['Виплати за крихти', formatSignedKop(-season.payoutsKop)] },
  ];

  return (
    <>
      <BreakdownTable
        head={['Джерело', 'Сума']}
        rows={rows}
        total={['Банка сезону', formatKop(season.jarKop)]}
        empty="Надходжень ще не було"
      />
      <div className={styles.note}>
        Коефіцієнт виводу: {formatCoefficient(season.coefficient)}. Виплати його не змінюють.
      </div>
    </>
  );
};

const supportContent = (summary: BudgetSummary) => (
  <BreakdownTable
    head={['Напрямок', 'Виділено', 'Витрачено', 'Залишок']}
    rows={summary.support.map(({ direction, allocatedKop, spentKop, balanceKop }) => ({
      key: direction,
      cells: [
        directionLabel(direction),
        formatKop(allocatedKop),
        formatKop(spentKop),
        formatKop(balanceKop),
      ],
    }))}
    total={[
      'Разом',
      formatKop(summary.supportAllocatedKop),
      formatKop(summary.supportSpentKop),
      formatKop(summary.supportKop),
    ]}
    empty="Напрямків ще немає"
  />
);

const ordersContent = (summary: BudgetSummary) => (
  <BreakdownTable
    head={['Тайтл', 'Отримано (90%)', 'Витрачено', 'Залишок']}
    rows={summary.orders.map(({ key, title, receivedKop, spentKop, balanceKop }) => ({
      key,
      cells: [title, formatKop(receivedKop), formatKop(spentKop), formatKop(balanceKop)],
    }))}
    total={
      summary.orders.length
        ? [
            'Разом',
            formatKop(summary.ordersReceivedKop),
            formatKop(summary.ordersSpentKop),
            formatKop(summary.ordersKop),
          ]
        : undefined
    }
    empty="Замовлень ще не було"
  />
);

const treatsContent = (summary: BudgetSummary) => (
  <BreakdownTable
    head={['Проєкт', 'Надійшло']}
    rows={summary.treats.map(({ key, title, kop }) => ({ key, cells: [title, formatKop(kop)] }))}
    total={summary.treats.length ? ['Разом', formatKop(summary.treatsKop)] : undefined}
    empty="Банок проєктів ще не було"
  />
);

const lisodariContent = (summary: BudgetSummary) => (
  <BreakdownTable
    head={['Учасник', 'Надійшло']}
    rows={summary.lisodari.map(({ key, name, kop }) => ({ key, cells: [name, formatKop(kop)] }))}
    total={summary.lisodari.length ? ['Разом', formatKop(summary.lisodariKop)] : undefined}
    empty="Лисодарів ще не було"
  />
);

export const BreakdownDialog: FC<BreakdownDialogProps> = ({
  kind,
  summary,
  season,
  canManage,
  onClose,
  onManageSupport,
}) => {
  const titles: Record<BreakdownKind, string> = {
    jar: season
      ? `Сезонна банка печива · ${seasonLabel(season.season, season.year)}`
      : 'Сезонна банка печива',
    support: 'Печивко підтримки',
    orders: 'Тістечка замовлень',
    treats: 'Смаколики',
    lisodari: 'Лисодари',
  };

  return (
    <CustomDialog open onClose={onClose}>
      <H6>{titles[kind]}</H6>

      <div className={styles.expenses}>
        {kind === 'jar' && season && jarContent(season)}
        {kind === 'support' && supportContent(summary)}
        {kind === 'orders' && ordersContent(summary)}
        {kind === 'treats' && treatsContent(summary)}
        {kind === 'lisodari' && lisodariContent(summary)}

        {kind === 'support' && canManage && (
          <div className={styles.actions}>
            <Button variant="contained" onClick={onManageSupport}>
              Змінити бюджети
            </Button>
          </div>
        )}
      </div>
    </CustomDialog>
  );
};
