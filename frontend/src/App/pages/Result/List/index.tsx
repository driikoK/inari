import { FC } from 'react';
import { Link } from 'react-router-dom';

import { InfoWrapper, ListContainer, Priority, VotesWrapper } from './styles';
import { Icon, P } from '@/components';

import MalImg from '/mal.png';

interface IPropList {
  anime: {
    name: string;
    link: string;
    isOngoing: boolean;
    isPriority: boolean;
    votes: {
      _id: string;
      userName: string;
    }[];
  };
  voteCount: number;
}

const List: FC<IPropList> = ({ anime, voteCount }) => {
  const votesArray = Array.isArray(anime.votes) ? anime.votes : [];

  return (
    <ListContainer>
      <InfoWrapper>
        <P>{anime.name}</P>
        <Link to={anime.link} target="_blank">
          <Icon img={MalImg} />
        </Link>
        {anime.isOngoing ? (
          <P sx={{ color: 'green' }}> — Онґоїнґ</P>
        ) : (
          <P sx={{ color: 'red' }}> — Старе</P>
        )}
        {anime.isPriority && <Priority> | Пріоритет</Priority>}
      </InfoWrapper>
      <P>Голосів: {voteCount}</P>

      {votesArray.length >= 1 && (
        <>
          <P>Голосували:</P>
          <VotesWrapper>
            {votesArray.map((vote) => (
              <P key={vote._id}>{vote.userName}</P>
            ))}
          </VotesWrapper>
        </>
      )}
    </ListContainer>
  );
};

export default List;
