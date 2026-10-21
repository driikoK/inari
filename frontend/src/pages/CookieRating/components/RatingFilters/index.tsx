import { useEffect, useState } from 'react';

import { SelectWrapper } from './styles';
import { SelectField } from '@/components';
import { useMembersStore, useRolesStore } from '@/stores';
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
  const [selectedRole, setSelectedRole] = useState<string>();
  const [selectedKind, setSelectedKind] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();

  const roles = useRolesStore((state) => state.roles);
  const { getMembers, membersDictionary } = useMembersStore();

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
      role: selectedRole,
      kind: selectedKind,
      season: selectedSeason,
      year: selectedYear,
    });
  }, [selectedRole, selectedKind, selectedUser, selectedSeason, selectedYear]);

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
        label="Роль"
        value={selectedRole}
        onChange={setSelectedRole}
        options={roles.map((role) => ({ value: role.value, label: role.label }))}
      />

      <SelectField
        label="Тип"
        value={selectedKind}
        onChange={setSelectedKind}
        options={[...memberKindOptions, { value: UNMARKED_KIND, label: UNMARKED_KIND_LABEL }]}
      />

      <SelectField
        label="Нікнейм"
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
