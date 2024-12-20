import { FunctionComponent } from 'react';
import toast from 'react-hot-toast';
import { Checkbox, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  CardContainer,
  CheckboxWrapper,
  InfoWrapper,
  LinkParagraph,
  LinkWrapper,
  Poster,
  PosterWrapper,
  PriorityWrapper,
  SponsoredWrapper,
} from './styles';
import usePollStore, { PollAnime } from '@/stores/usePollStore';
import P from '@/components/Typography/P';
import { Icon } from '@/components/Icon';

import MalImg from '/mal.png';
import { usePermissions } from '@/hooks/usePermissions';
import { SUBJECTS } from '@/context/casl';

export interface ICardProps {
  card: PollAnime;
  checked: boolean;
  onCheckboxChange: () => void;
}

const PollCard: FunctionComponent<ICardProps> = ({ card, checked, onCheckboxChange }) => {
  const { isDecided, isPriority, isSponsored, link, name, posterUrl } = card;
  const { deleteAnime } = usePollStore();
  const { hasAccess } = usePermissions();

  const handleDelete = () => {
    deleteAnime(card._id);
    toast.success('Аніме видалено');
  };

  // TODO: refactor styles
  return (
    <CardContainer>
      <PosterWrapper>
        {!isDecided && (
          <CheckboxWrapper>
            <Checkbox checked={checked} onChange={onCheckboxChange} />
          </CheckboxWrapper>
        )}
        {isPriority && <PriorityWrapper>+25% крихт</PriorityWrapper>}
        {isSponsored && <SponsoredWrapper>Від меценатів</SponsoredWrapper>}
        <Poster $url={posterUrl} onClick={isDecided ? () => {} : onCheckboxChange} />
      </PosterWrapper>
      <InfoWrapper>
        <LinkWrapper href={link} target="_blank">
          <Icon img={MalImg} />
          <LinkParagraph>MAL</LinkParagraph>
        </LinkWrapper>
        <P>{name}</P>
        <br />
        <br />

        <P sx={(theme) => ({ color: theme.palette.info.main })}>
          {isDecided && '(Тайтл точно робитиметься)'}
        </P>

        {hasAccess(SUBJECTS.DELETE_POLL_ANIME) && (
          <IconButton onClick={handleDelete} sx={{ cursor: 'pointer', paddingLeft: 0 }}>
            <DeleteIcon color="warning" />
          </IconButton>
        )}
      </InfoWrapper>
    </CardContainer>
  );
};

export default PollCard;
