import { FC } from 'react';
import { Skeleton } from '@mui/material';

import { CardsWrapper, TitleWrapper } from '../../styles';
import { PollCard } from '@/pages/Vote/components';
import { PollAnime } from '@/stores/usePollStore';
import { H6 } from '@/components';

interface ICardProps {
  animes: PollAnime[];
  sectionTitle: string;
  isLoading: boolean;
}

const skeletons = new Array(10).fill(0);

const PollSection: FC<ICardProps> = ({ animes, sectionTitle = '', isLoading }) => {
  return (
    <>
      <TitleWrapper>
        <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>{sectionTitle}</H6>
      </TitleWrapper>

      <CardsWrapper>
        {isLoading
          ? skeletons.map((_, index) => (
              <Skeleton variant="rectangular" width={320} height={500} key={index} />
            ))
          : animes.map((card, index) => (
              <PollCard key={`${card._id}-${sectionTitle}`} card={card} />
            ))}
      </CardsWrapper>
    </>
  );
};

export default PollSection;
