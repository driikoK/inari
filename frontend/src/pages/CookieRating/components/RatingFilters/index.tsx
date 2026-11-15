import { useEffect, useState } from 'react';

import { SelectWrapper } from './styles';
import { SearchSelect, SeasonFilter, SelectField } from '@/components';
import { useMembersStore } from '@/stores';
import { memberKindOptions } from '@/utils/constants';

export const RatingFilters = () => {
  const [selectedSeason, setSelectedSeason] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedKind, setSelectedKind] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();

  const getMembers = useMembersStore((state) => state.getMembers);
  const membersDictionary = useMembersStore((state) => state.membersDictionary);

  useEffect(() => {
    getMembers({
      id: selectedUser,
      kind: selectedKind,
      season: selectedSeason,
      year: selectedYear,
    });
  }, [selectedKind, selectedUser, selectedSeason, selectedYear]);

  return (
    <SelectWrapper>
      <SelectField
        label="Тип"
        value={selectedKind}
        onChange={setSelectedKind}
        options={memberKindOptions}
      />

      <SearchSelect
        label="Нікнейм"
        value={selectedUser}
        onChange={setSelectedUser}
        noOptionsText="Нікнейм не знайдено"
        options={membersDictionary.map((member) => ({
          value: member._id,
          label: member.nickname,
        }))}
      />

      <SeasonFilter
        season={selectedSeason}
        year={selectedYear}
        onChange={(season, year) => {
          setSelectedSeason(season);
          setSelectedYear(year);
        }}
      />
    </SelectWrapper>
  );
};
