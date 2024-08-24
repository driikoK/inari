import { FunctionComponent, useEffect, useState } from 'react';
import {
  ListsWrapper,
  PageContainer,
  PageWrapper,
  Title,
  TitleWrapper,
} from './styles';
import { TResultAnime } from '../../../types';
import InfoDialog from '../../dialogs/InfoDialog';
import List from '../../../components/List';

const Result: FunctionComponent = () => {
  const [data, setData] = useState<TResultAnime[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [dialogText, setDialogText] = useState('');

  const handleInfoDialogClose = () => {
    setOpenInfoDialog(false);
  };

  useEffect(() => {
    setLoadingData(true);
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.API_URL}/result`);
        const result = await response.json();
        setData(result);
        console.log(result);
      } catch (error) {
        console.error('Error fetching data:', error);
        setOpenInfoDialog(true);
        setDialogText('Сервер пішов спати 😪');
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
          <Title>Результати</Title>
        </TitleWrapper>
        <ListsWrapper>
          {loadingData ? (
            <Title>Завантаження...</Title>
          ) : (
            data.map((item) => (
              <List
                key={item.anime._id}
                anime={item.anime}
                voteCount={item.voteCount}
              />
            ))
          )}
        </ListsWrapper>
        <InfoDialog
          open={openInfoDialog}
          text={dialogText}
          onClose={handleInfoDialogClose}
        />
      </PageWrapper>
    </PageContainer>
  );
};

export default Result;
