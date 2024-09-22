import { useEffect, useState } from 'react';

import SelectField from '@/components/SelectField';
import useRolesStore from '@/stores/useRolesStore';
import useUsersStore from '@/stores/useUsersStore';
import { seasonOptions, yearOptions } from '@/consts';
import { SelectWrapper } from './styles';

export const RatingFilters = () => {
  const [selectedSeason, setSelectedSeason] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedRole, setSelectedRole] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();

  const { roles } = useRolesStore();
  const { getUsers, usersDictionary } = useUsersStore();

  const seasonsOfTheYear = seasonOptions.reduce((acc, season) => {
    yearOptions.forEach((year) => {
      acc.push({ label: `${season.label} ${year.label}`, value: `${season.value} ${year.value}` });
    });

    return acc;
  }, [] as { label: string; value: string }[]);

  useEffect(() => {
    getUsers({
      id: selectedUser,
      role: selectedRole,
      season: selectedSeason,
      year: selectedYear,
    });
  }, [selectedRole, selectedUser, selectedSeason, selectedYear]);

  const handleSeasonChange = (season: string = '') => {
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
        label="Нікнейм"
        value={selectedUser}
        onChange={setSelectedUser}
        options={usersDictionary.map((user) => ({
          value: user._id,
          label: user.nickname,
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
