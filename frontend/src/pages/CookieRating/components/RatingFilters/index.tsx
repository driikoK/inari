import { useEffect, useState } from 'react';

import { SelectWrapper } from './styles';
import { NicknameFilter } from '../NicknameFilter';
import { SelectField } from '@/components';
import { useMembersStore } from '@/stores';
import {
  memberKindOptions,
  seasonOptions,
  UNMARKED_KIND,
  UNMARKED_KIND_LABEL,
  yearOptions,
} from '@/utils/constants';

export const RatingFilters = () => {
  const [selectedSeason, setSelectedSeason] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedKind, setSelectedKind] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();

  const getMembers = useMembersStore((state) => state.getMembers);
  const membersDictionary = useMembersStore((state) => state.membersDictionary);

  const seasonsOfTheYear = seasonOptions.reduce(
    (acc, season) => {
      yearOptions.forEach((year) => {
        acc.push({
          label: `${season.label} ${year.label}`,
          value: `${season.value} ${year.value}`,
        });
      });

      return acc;
    },
    [] as { label: string; value: string }[],
  );

  useEffect(() => {
    getMembers({
      id: selectedUser,
      kind: selectedKind,
      season: selectedSeason,
      year: selectedYear,
    });
  }, [selectedKind, selectedUser, selectedSeason, selectedYear]);

  const handleSeasonChange = (season: string = '') => {
    if (!season) {
      setSelectedSeason(undefined);
      setSelectedYear(undefined);
      return;
    }

    const [seasonName, seasonYear] = season.split(' ');

    setSelectedSeason(seasonName || '');
    setSelectedYear(Number(seasonYear) || undefined);
  };

  return (
    <SelectWrapper>
      <SelectField
        label="Тип"
        value={selectedKind}
        onChange={setSelectedKind}
        options={[...memberKindOptions, { value: UNMARKED_KIND, label: UNMARKED_KIND_LABEL }]}
      />

      <NicknameFilter
        value={selectedUser}
        onChange={setSelectedUser}
        options={membersDictionary.map((member) => ({
          value: member._id,
          label: member.nickname,
        }))}
      />

      <SelectField
        label="Сезон"
        value={selectedYear && selectedSeason ? `${selectedSeason} ${selectedYear}` : ''}
        onChange={handleSeasonChange}
        options={seasonsOfTheYear.map((season) => ({
          value: season.value,
          label: season.label,
        }))}
      />
    </SelectWrapper>
  );
};
