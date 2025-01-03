import { FC, useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

import { ListsWrapper, PageContainer, PageWrapper, TitleWrapper } from './styles';
import List from './List';

import { TResultAnime } from '@/types';
import axios from '@/api';
import { H6 } from '@/components';

const Result: FC = () => {
  const [data, setData] = useState<TResultAnime[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    const fetchData = async () => {
      try {
        const response = await axios.get(`/polls/result`);

        setData(response.data);
      } catch (error) {
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PageContainer>
      <PageWrapper>
        <TitleWrapper>
          <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>Результати</H6>
        </TitleWrapper>
        <ListsWrapper>
          {loadingData ? (
            <CircularProgress />
          ) : (
            data.map((item) => (
              <List key={item.anime._id} anime={item.anime} voteCount={item.voteCount} />
            ))
          )}
        </ListsWrapper>
      </PageWrapper>
    </PageContainer>
  );
};

export default Result;
