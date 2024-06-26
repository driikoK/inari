/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect, useState } from 'react';
import {
  PageContainer,
  RatingBlock,
  RatingContainer,
  SelectWrapper,
  Title,
  TitleWrapper,
} from './styles';
import RatingRow from '@/components/RatingRow';
import theme from '@theme';
import { useMediaQuery } from '@mui/material';
import useSeasonsStore from '@/stores/useSeasons';
import { reverseDetermineAnimeSeason } from '@/utils/season.utils';
import useTracksStore from '@/stores/useTracksStore';
import { processTracks } from '@/utils/tracks.utils';
import useAnimeStore from '@/stores/useAnimeStore';
import useTypeStore from '@/stores/useTypesStore';
import useUsersStore from '@/stores/useUsersStore';
import SelectField from '@/components/SelectField';

const CookieRating: FunctionComponent = () => {
  const { seasons, getSeasons } = useSeasonsStore();
  const { tracks, getTracks } = useTracksStore();
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

  const { tracksFirstHalf, tracksSecondHalf, tracksHalfIndex, sortedTracks } =
    processTracks(tracks);

  const isDesktop = useMediaQuery(theme.screens.desktop);

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
        <Title>Рейтинг крихт</Title>
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
      {isDesktop ? (
        <RatingContainer>
          <RatingBlock>
            {tracksFirstHalf.map((rating, index) => (
              <RatingRow
                key={index}
                number={index + 1}
                nickname={rating.nickname}
                coins={rating.coin}
              />
            ))}
          </RatingBlock>
          <RatingBlock>
            {tracksSecondHalf.map((rating, index) => (
              <RatingRow
                key={index + tracksHalfIndex}
                number={index + tracksHalfIndex + 1}
                nickname={rating.nickname}
                coins={rating.coin}
              />
            ))}
          </RatingBlock>
        </RatingContainer>
      ) : (
        sortedTracks.map((rating, index) => (
          <RatingRow
            key={index}
            number={index + 1}
            nickname={rating.nickname}
            coins={rating.coin}
          />
        ))
      )}
    </PageContainer>
  );
};

export default CookieRating;
