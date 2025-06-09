import { FC, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

import { ListsWrapper, PageWrapper, TitleWrapper } from './styles';
import VoteList from './components/VoteList';

import { H6 } from '@/components';
import { usePollStore } from '@/stores';

const Result: FC = () => {
  const { result, getResult, isLoading } = usePollStore();

  useEffect(() => {
    getResult();
  }, []);

  return (
    <PageWrapper>
      {isLoading ? (
        <CircularProgress />
      ) : result.length > 0 ? (
        <>
          <TitleWrapper>
            <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>Результати</H6>
          </TitleWrapper>

          <ListsWrapper>
            {result.map((item) => (
              <VoteList key={item.animeId} result={item} />
            ))}
          </ListsWrapper>
        </>
      ) : (
        <TitleWrapper>
          <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>Результатів поки немає</H6>
        </TitleWrapper>
      )}
    </PageWrapper>
  );
};

export default Result;
