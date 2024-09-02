import { FunctionComponent } from 'react';
import {
  CardContainer,
  CheckboxWrapper,
  Icon,
  InfoWrapper,
  LinkParagraph,
  LinkWrapper,
  Paragraph,
  Poster,
  PosterWrapper,
  PriorityWrapper,
  SponsoredWrapper,
} from './styles';
import { Checkbox } from '@mui/material';

export interface ICardProps {
  name: string;
  link: string;
  posterUrl: string;
  checked: boolean;
  isPriority: boolean;
  isDecided: boolean;
  isSponsored: boolean;
  onCheckboxChange: () => void;
}

const Card: FunctionComponent<ICardProps> = ({
  name,
  link,
  posterUrl,
  checked,
  isPriority,
  isDecided,
  isSponsored,
  onCheckboxChange,
}) => {
  return (
    <CardContainer>
      <PosterWrapper>
        <CheckboxWrapper>
          <Checkbox checked={checked} onChange={onCheckboxChange} />
        </CheckboxWrapper>
        {isPriority && <PriorityWrapper>+25% крихт</PriorityWrapper>}
        {isSponsored && <SponsoredWrapper>Від меценатів</SponsoredWrapper>}
        <Poster $url={posterUrl} onClick={onCheckboxChange} />
      </PosterWrapper>
      <InfoWrapper>
        <LinkWrapper href={link} target="_blank">
          <Icon />
          <LinkParagraph>MAL</LinkParagraph>
        </LinkWrapper>
        <Paragraph>{name}</Paragraph>
        <br />
        <br />
        <Paragraph style={{color: 'red'}}>{isDecided && "(Тайтл остаточно робитиметься)"}</Paragraph>
      </InfoWrapper>
    </CardContainer>
  );
};

export default Card;
