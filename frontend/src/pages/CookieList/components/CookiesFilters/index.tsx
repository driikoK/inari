import { useEffect, useState } from 'react';

import { SelectWrapper } from './styles';
import { SelectField } from '@/components';
import { useAnimesStore, useRolesStore, useMembersStore, useTracksStore } from '@/stores';
import { seasonOptions, yearOptions } from '@/consts';

export const CookiesFilters = () => {
  const { getTracks, appliedFilters } = useTracksStore();

  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(
    appliedFilters.season || undefined
  );
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    appliedFilters.year || undefined
  );
  const [selectedAnime, setSelectedAnime] = useState<string | undefined>(
    appliedFilters.nameTitle || undefined
  );
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    appliedFilters.typeRole || undefined
  );
  const [selectedUser, setSelectedUser] = useState<string | undefined>(
    appliedFilters.nickname || undefined
  );

  const animeNames = useAnimesStore((state) => state.animeNames);
  const roles = useRolesStore((state) => state.roles);
  const members = useMembersStore((state) => state.members);

  useEffect(() => {
    getTracks({
      ...appliedFilters,
      season: selectedSeason,
      nameTitle: selectedAnime,
      nickname: selectedUser,
      typeRole: selectedRole,
      year: selectedYear,
    });
  }, [selectedSeason, selectedAnime, selectedRole, selectedUser, selectedSeason, selectedYear]);

  return (
    <SelectWrapper>
      <SelectField
        label="Нікнейм"
        value={selectedUser}
        onChange={setSelectedUser}
        options={members.map((member) => ({
          value: member.nickname,
          label: member.nickname,
        }))}
      />

      <SelectField
        label="Аніме"
        value={selectedAnime}
        onChange={setSelectedAnime}
        options={animeNames.map((anime) => ({
          value: anime.name,
          label: anime.name,
        }))}
      />

      <SelectField
        label="Роль"
        value={selectedRole}
        onChange={setSelectedRole}
        options={roles.map((role) => ({ value: role.value, label: role.label }))}
      />

      <SelectField
        label="Сезон"
        value={selectedSeason}
        onChange={setSelectedSeason}
        options={seasonOptions.map((season) => ({
          value: season.value,
          label: season.label,
        }))}
      />

      <SelectField
        label="Рік"
        value={selectedYear}
        onChange={setSelectedYear}
        options={yearOptions.map((year) => ({
          value: year.value,
          label: year.label,
        }))}
      />
    </SelectWrapper>
  );
};
