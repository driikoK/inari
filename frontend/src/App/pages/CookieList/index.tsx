/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import {
  ClearOptionItem,
  ListWrapper,
  PageContainer,
  SelectWrapper,
  StyledSelect,
  Title,
  TitleWrapper,
} from './styles';
import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  useMediaQuery,
} from '@mui/material';
import useSeasonsStore from '@/stores/useSeasons';
import { reverseDetermineAnimeSeason } from '@/utils/season.utils';
import useTracksStore from '@/stores/useTracksStore';
import useAnimeStore from '@/stores/useAnimeStore';
import useTypeStore from '@/stores/useTypesStore';
import useUsersStore from '@/stores/useUsersStore';
import ListCard from '@/components/ListCard';

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

  // const isDesktop = useMediaQuery(theme.screens.desktop);

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
        <FormControl sx={{ m: 1, width: '100%' }}>
          <InputLabel id="name-label">Сезон</InputLabel>
          <StyledSelect
            input={<OutlinedInput label="Сезон" />}
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value as number)}
          >
            <MenuItem value={undefined}>
              <ClearOptionItem> Скасувати вибір </ClearOptionItem>
            </MenuItem>
            {seasons.map((season) => (
              <MenuItem key={season._id} value={season._id}>
                {reverseDetermineAnimeSeason(season._id)}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
        <FormControl sx={{ m: 1, width: '100%' }}>
          <InputLabel id="name-label">Роль</InputLabel>
          <StyledSelect
            input={<OutlinedInput label="Роль" />}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as string)}
          >
            <MenuItem value={undefined}>
              <ClearOptionItem> Скасувати вибір </ClearOptionItem>
            </MenuItem>
            {types.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
        <FormControl sx={{ m: 1, width: '100%' }}>
          <InputLabel id="name-label">Нікнейм</InputLabel>
          <StyledSelect
            input={<OutlinedInput label="Нікнейм" />}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value as string)}
          >
            <MenuItem value={undefined}>
              <ClearOptionItem> Скасувати вибір </ClearOptionItem>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user._id} value={user.nickname}>
                {user.nickname}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
        <FormControl sx={{ m: 1, width: '100%' }}>
          <InputLabel id="name-label">Аніме</InputLabel>
          <StyledSelect
            input={<OutlinedInput label="Аніме" />}
            value={selectedAnime}
            onChange={(e) => setSelectedAnime(e.target.value as string)}
          >
            <MenuItem value={undefined}>
              <ClearOptionItem> Скасувати вибір </ClearOptionItem>
            </MenuItem>
            {animeNames.map((anime) => (
              <MenuItem key={anime._id} value={anime._id}>
                {anime._id}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
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
