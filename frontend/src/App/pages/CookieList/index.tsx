/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import {
  ListWrapper,
  PageContainer,
  SelectWrapper,
  Title,
  TitleWrapper,
} from './styles';
import useSeasonsStore from '@/stores/useSeasons';
import { reverseDetermineAnimeSeason } from '@/utils/season.utils';
import useTracksStore from '@/stores/useTracksStore';
import useAnimeStore from '@/stores/useAnimeStore';
import useTypeStore from '@/stores/useTypesStore';
import useUsersStore from '@/stores/useUsersStore';
import ListCard from '@/components/ListCard';
import SelectField from '@/components/SelectField';

const CookieList: FunctionComponent = () => {
  const { seasons, getSeasons } = useSeasonsStore();
  const { tracks, getTracks, deleteTracks } = useTracksStore();
  const { animeNames, getAnime } = useAnimeStore();
  const { types, getTypes } = useTypeStore();
  const { users, getUsers } = useUsersStore();
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(
    undefined
  );
  const [selectedAnime, setSelectedAnime] = useState<string | undefined>(
    undefined
  );
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    undefined
  );
  const [selectedUser, setSelectedUser] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    getSeasons();
    getTracks();
    getAnime();
    getTypes();
    getUsers();
  }, []);

  useEffect(() => {
    getTracks({
      season: selectedSeason,
      nameTitle: selectedAnime,
      nickname: selectedUser,
      typeRole: selectedRole,
    });
  }, [selectedSeason, selectedAnime, selectedRole, selectedUser]);

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Список крихт</Title>
      </TitleWrapper>
      <SelectWrapper>
        <SelectField
          label="Сезон"
          value={selectedSeason}
          onChange={setSelectedSeason}
          options={seasons.map((season) => ({
            value: season._id,
            label: reverseDetermineAnimeSeason(season._id),
          }))}
        />
        <SelectField
          label="Роль"
          value={selectedRole}
          onChange={setSelectedRole}
          options={types.map((type) => ({ value: type, label: type }))}
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
            value: anime._id,
            label: anime._id,
          }))}
        />
      </SelectWrapper>
      <ListWrapper>
        {tracks.map((track) => (
          <ListCard
            id={track._id}
            key={track._id}
            typeRole={track.typeRole}
            nickname={track.nickname}
            coins={track.coin}
            note={track.note}
            currentEpisode={track.currentEpisode}
            titleName={track.nameTitle}
            onDelete={deleteTracks}
          />
        ))}
      </ListWrapper>
    </PageContainer>
  );
};

export default CookieList;
