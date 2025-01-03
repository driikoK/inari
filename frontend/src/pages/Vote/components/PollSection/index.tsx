import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { Skeleton } from '@mui/material';

import { CardsWrapper, TitleWrapper } from '../../styles';
import { PollCard } from '@/pages/Vote/components';
import { PollAnime } from '@/stores/usePollStore';
import { H6 } from '@/components';
import { ChosenAnimes } from '../..';

export interface ICardProps {
  animes: PollAnime[];
  control: Control<ChosenAnimes, any>;
  sectionTitle: string;
  isLoading: boolean;
}

const skeletons = new Array(7).fill(0);

const PollSection: FC<ICardProps> = ({ animes, control, sectionTitle = '', isLoading }) => {
  const toggleAnimeId = (value: string[], id: string) =>
    value.includes(id) ? value.filter((item) => item !== id) : [...value, id];

  return (
    <>
      <TitleWrapper>
        <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>{sectionTitle}</H6>
      </TitleWrapper>

      <CardsWrapper>
        {isLoading
          ? skeletons.map((_, index) => (
              <Skeleton variant="rectangular" width={225} height={300} key={index} />
            ))
          : animes.map((card) => (
              <Controller
                key={card._id}
                name="animeIds"
                control={control}
                render={({ field }) => (
                  <PollCard
                    card={card}
                    checked={field.value.includes(card._id)}
                    onCheckboxChange={() => {
                      const selectedCards = toggleAnimeId(field.value, card._id);

                      field.onChange(selectedCards);
                    }}
                  />
                )}
              />
            ))}
      </CardsWrapper>
    </>
  );
};

export default PollSection;
