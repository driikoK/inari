import { FC, useEffect, useMemo, useState } from 'react';

import { Box, MenuItem, Pagination, TextField } from '@mui/material';

import { seasonLabel } from '@/pages/Proposals/const/options';
import useBudgetStore, { type AuditParams } from '@/stores/useBudgetStore';
import useRolesStore from '@/stores/useRolesStore';
import type { AUDIT_KIND } from '@/types';
import { notifyFailure } from '@/utils/request';
import { auditKindOptions, recentSeasons, seasonKey } from '../const/options';
import { AuditOperationCard } from './AuditOperationCard';

interface AuditTabProps {
  today: string;
}

const ALL = 'all';
const PER_PAGE = 20;
const SEARCH_DELAY_MS = 400;

export const AuditTab: FC<AuditTabProps> = ({ today }) => {
  const audit = useBudgetStore((state) => state.audit);
  const getAudit = useBudgetStore((state) => state.getAudit);
  const clearAudit = useBudgetStore((state) => state.clearAudit);
  const getRoles = useRolesStore((state) => state.getRoles);

  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [seasonValue, setSeasonValue] = useState(ALL);
  const [kind, setKind] = useState<AUDIT_KIND | typeof ALL>(ALL);
  const [typedSearch, setTypedSearch] = useState('');
  const [search, setSearch] = useState('');

  const seasons = useMemo(() => recentSeasons(today), [today]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typedSearch.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [typedSearch]);

  const params = useMemo<AuditParams>(() => {
    const picked = seasons.find(({ season, year }) => seasonKey(season, year) === seasonValue);

    return {
      page,
      perPage: PER_PAGE,
      ...(from && { from }),
      ...(to && { to }),
      ...(picked && { season: picked.season, year: picked.year }),
      ...(kind !== ALL && { kind }),
      ...(search && { search }),
    };
  }, [page, from, to, seasonValue, kind, search, seasons]);

  useEffect(() => {
    getAudit(params).catch(notifyFailure);
  }, [params, getAudit]);

  useEffect(() => clearAudit, [clearAudit]);

  useEffect(() => {
    getRoles().catch(notifyFailure);
  }, [getRoles]);

  const filter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          size="small"
          label="Пошук"
          placeholder="Нікнейм, банка або хто змінив"
          value={typedSearch}
          onChange={(event) => setTypedSearch(event.target.value)}
          sx={{ width: 260 }}
        />
        <TextField
          select
          size="small"
          label="Подія"
          value={kind}
          onChange={(event) => filter(setKind)(event.target.value as AUDIT_KIND | typeof ALL)}
          sx={{ width: 210 }}
        >
          <MenuItem value={ALL}>Усі події</MenuItem>
          {auditKindOptions.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Сезон"
          value={seasonValue}
          onChange={(event) => filter(setSeasonValue)(event.target.value)}
          sx={{ width: 170 }}
        >
          <MenuItem value={ALL}>Усі сезони</MenuItem>
          {seasons.map(({ season, year }) => (
            <MenuItem key={seasonKey(season, year)} value={seasonKey(season, year)}>
              {seasonLabel(season, year)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          size="small"
          label="З"
          value={from}
          onChange={(event) => filter(setFrom)(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="date"
          size="small"
          label="По"
          value={to}
          onChange={(event) => filter(setTo)(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      {audit && audit.data.length === 0 && (
        <div style={{ color: 'var(--text-muted)' }}>Подій за цими фільтрами немає.</div>
      )}

      {audit?.data.map((operation) => (
        <AuditOperationCard key={operation.operationId} operation={operation} />
      ))}

      {audit && audit.total > PER_PAGE && (
        <Pagination
          count={Math.ceil(audit.total / PER_PAGE)}
          page={page}
          onChange={(_, value) => setPage(value)}
          sx={{ alignSelf: 'center' }}
        />
      )}
    </Box>
  );
};
