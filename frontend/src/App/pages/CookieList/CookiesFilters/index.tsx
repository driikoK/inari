import { useEffect, useState } from 'react';

import SelectField from '@/components/SelectField';
import useAnimeStore from '@/stores/useAnimeStore';
import useRolesStore from '@/stores/useRolesStore';
import useSeasonsStore from '@/stores/useSeasons';
import useUsersStore from '@/stores/useUsersStore';
import useTracksStore from '@/stores/useTracksStore';
import { SelectWrapper } from './styles';

export const CookiesFilters = () => {
  const [selectedSeason, setSelectedSeason] = useState<number>();
  const [selectedAnime, setSelectedAnime] = useState<string>();
  const [selectedRole, setSelectedRole] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();

  const { seasons } = useSeasonsStore();
  const { animeNames } = useAnimeStore();
  const { roles } = useRolesStore();
  const { users } = useUsersStore();
  const { getTracks } = useTracksStore();

  useEffect(() => {
    if (selectedSeason || selectedAnime || selectedUser || selectedRole) {
      getTracks({
        season: selectedSeason,
        nameTitle: selectedAnime,
        nickname: selectedUser,
        typeRole: selectedRole,
      });
    }
  }, [selectedSeason, selectedAnime, selectedRole, selectedUser]);

  return (
    <SelectWrapper>
      {/* <SelectField
        label="Сезон"
        value={selectedSeason}
        onChange={setSelectedSeason}
        options={seasons.map((season) => ({
          value: season._id,
          label: reverseDetermineAnimeSeason(season._id),
        }))}
      /> */}
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
        options={users.map((user) => ({
          value: user.nickname,
          label: user.nickname,
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
    </SelectWrapper>
  );
};
