import { FunctionComponent } from 'react';
import {
  Icon,
  InfoWrapper,
  LinkParagraph,
  LinkWrapper,
  ListContainer,
  Old,
  Ongoing,
  Paragraph,
  VotesWrapper,
} from './styles';

interface IPropList {
  anime: {
    name: string;
    link: string;
    isOngoing: boolean;
    votes: {
      _id: string;
      userName: string;
    }[];
  };
  voteCount: number;
}

const List: FunctionComponent<IPropList> = ({ anime, voteCount }) => {
  const votesArray = Array.isArray(anime.votes) ? anime.votes : [];
  return (
    <ListContainer>
      <InfoWrapper>
        <Paragraph>{anime.name}</Paragraph>
        <LinkWrapper href={anime.link} target="_blank">
          <Icon />
          <LinkParagraph>MAL</LinkParagraph>
        </LinkWrapper>
        {anime.isOngoing ? <Ongoing> - Онґоїнґ</Ongoing> : <Old> - Старе</Old>}
      </InfoWrapper>
      <Paragraph>Голосів: {voteCount}</Paragraph>
      {votesArray.length >= 1 && (
        <>
          <Paragraph>Голосували:</Paragraph>
          <VotesWrapper>
            {votesArray.map((vote) => (
              <Paragraph key={vote._id}>{vote.userName}</Paragraph>
            ))}
          </VotesWrapper>
        </>
      )}
    </ListContainer>
  );
};

export default List;
