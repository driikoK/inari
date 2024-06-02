/* eslint-disable react-hooks/exhaustive-deps */
import { FunctionComponent, useEffect } from 'react';
import {
  PageContainer,
  RatingBlock,
  RatingContainer,
  SelectWrapper,
  StyledSelect,
  Title,
  TitleWrapper,
} from './styles';
import RatingRow from '@/components/RatingRow';
import theme from '@theme';
import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  useMediaQuery,
} from '@mui/material';
import useTypeStore from '@/stores/useTypesStore';

const RolesRating: FunctionComponent = () => {
  const { types, getTypes} = useTypeStore();

  useEffect(() => {
    getTypes();
  }, []);
  
  const users = [
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
    {
      nickname: 'ДрійкоДрійко',
      coins: 45,
    },
  ];
  const halfIndex = Math.ceil(users.length / 2);
  const firstHalf = users.slice(0, halfIndex);
  const secondHalf = users.slice(halfIndex);
  const isDesktop = useMediaQuery(theme.screens.desktop);
  const seasons = ['зима 2024', 'весна 2024', 'літо 2024', 'осінь 2024'];

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Сезонний топ за ролями</Title>
      </TitleWrapper>
      <SelectWrapper>
        <FormControl sx={{ m:1, width: '100%' }}>
          <InputLabel id="name-label">Сезон</InputLabel>
          <StyledSelect input={<OutlinedInput label="Сезон" />}>
            {seasons.map((season) => (
              <MenuItem key={season} value={season}>
                {season}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
        <FormControl sx={{ m:1, width: '100%' }}>
          <InputLabel id="name-label">Роль</InputLabel>
          <StyledSelect input={<OutlinedInput label="Роль" />}>
            {types.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
      </SelectWrapper>
      {isDesktop ? (
        <RatingContainer>
          <RatingBlock>
            {firstHalf.map((rating, index) => (
              <RatingRow
                key={index}
                number={index + 1}
                nickname={rating.nickname}
                coins={rating.coins}
              />
            ))}
          </RatingBlock>
          <RatingBlock>
            {secondHalf.map((rating, index) => (
              <RatingRow
                key={index + halfIndex}
                number={index + halfIndex + 1}
                nickname={rating.nickname}
                coins={rating.coins}
              />
            ))}
          </RatingBlock>
        </RatingContainer>
      ) : (
        users.map((rating, index) => (
          <RatingRow
            key={index}
            number={index + 1}
            nickname={rating.nickname}
            coins={rating.coins}
          />
        ))
      )}
    </PageContainer>
  );
};

export default RolesRating;
