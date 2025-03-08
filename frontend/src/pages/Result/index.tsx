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
      <TitleWrapper>
        <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>
          {result.length ? 'Результати' : 'Результатів поки немає'}
        </H6>
      </TitleWrapper>

      <ListsWrapper>
        {isLoading ? (
          <CircularProgress />
        ) : (
          result.map((item) => <VoteList key={item.animeId} result={item} />)
        )}
      </ListsWrapper>
    </PageWrapper>
  );
};

export default Result;
