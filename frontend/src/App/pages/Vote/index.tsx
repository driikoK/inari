import { FunctionComponent, useEffect, useState } from 'react';
import Card from '../../../components/Card';
import {
  ButtonWrapper,
  CardsWrapper,
  PageContainer,
  PageWrapper,
  SubmitButton,
  Title,
  TitleWrapper,
} from './styles';
import { TAnime } from '../../../types';
import InfoDialog from '../../dialogs/InfoDialog';
import InputDialog from '../../dialogs/InputDialog';

const Vote: FunctionComponent = () => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [ongoingsData, setOngoinsData] = useState<TAnime[]>([]);
  const [oldsData, setOldsData] = useState<TAnime[]>([]);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [openInputDialog, setOpenIputDialog] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [loadingButton, setLoadingButton] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [userName, setUserName] = useState('');

  const handleInfoDialogClose = () => {
    setOpenInfoDialog(false);
  };

  const handleInputDialogClose = () => {
    setOpenIputDialog(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setOpenIputDialog(true);
      try {
        const ongoingsResponse = await fetch(`${process.env.API_URL}/polls/ongoings`);
        const ongoings = await ongoingsResponse.json();
        setOngoinsData(ongoings);

        const oldsResponse = await fetch(`${process.env.API_URL}/polls/olds`);
        const olds = await oldsResponse.json();
        setOldsData(olds);
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

  const handleCheckboxChange = (id: string) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter((item) => item !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleSubmit = async () => {
    setLoadingButton(true);
    try {
      if (!selectedCards.length) {
        setOpenInfoDialog(true);
        setDialogText('Ти не обрав(-ла) жодного аніме 😶');
      } else if (selectedCards.length > 5) {
        setOpenInfoDialog(true);
        setDialogText('Ти обрав(-ла) більше 5 аніме 😶');
      } else {
        const requestBody = {
          userName,
          animeIds: selectedCards,
        };

        const voteResponse = await fetch(`${process.env.API_URL}/polls/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (voteResponse.ok) {
          // Success
          setOpenInfoDialog(true);
          setDialogText('Дякую за участь 🥰');
        } else {
          // Handle error responses
          const errorMessage = await voteResponse.text();
          const errorObject = JSON.parse(errorMessage);

          if (errorObject.message === 'Error: The user has already voted') {
            setOpenInfoDialog(true);
            setDialogText('Ти вже голосував(-ла) 🤨');
          } else {
            setOpenInfoDialog(true);
            setDialogText('Якась помилка 😰');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching IP address or voting:', error);
    } finally {
      setLoadingButton(false);
    }
  };

  return (
    <PageContainer>
      <PageWrapper>
        <TitleWrapper>
          <Title>Онґоїнґи</Title>
        </TitleWrapper>
        <CardsWrapper>
          {loadingData ? (
            <Title>Завантаження...</Title>
          ) : (
            ongoingsData.map((card) => (
              <Card
                key={card._id}
                name={card.name}
                link={card.link}
                posterUrl={card.posterUrl}
                checked={selectedCards.includes(card._id)}
                isPriority={card.isPriority}
                isDecided={card.isDecided}
                isSponsored={card.isSponsored}
                onCheckboxChange={() => handleCheckboxChange(card._id)}
              />
            ))
          )}
        </CardsWrapper>
        <TitleWrapper>
          <Title>Старі тайтли</Title>
        </TitleWrapper>
        <CardsWrapper>
          {loadingData ? (
            <Title>Завантаження...</Title>
          ) : (
            oldsData.map((card) => (
              <Card
                key={card._id}
                name={card.name}
                link={card.link}
                posterUrl={card.posterUrl}
                checked={selectedCards.includes(card._id)}
                isPriority={card.isPriority}
                isDecided={card.isDecided}
                isSponsored={card.isSponsored}
                onCheckboxChange={() => handleCheckboxChange(card._id)}
              />
            ))
          )}
        </CardsWrapper>
        {ongoingsData.length !== 0 || oldsData.length !== 0 ? (
          <ButtonWrapper>
            <SubmitButton variant="contained" onClick={handleSubmit}>
              {loadingButton ? 'Завантаження...' : 'Проголосувати'}
            </SubmitButton>
          </ButtonWrapper>
        ) : null}
        <InfoDialog open={openInfoDialog} text={dialogText} onClose={handleInfoDialogClose} />
        <InputDialog
          open={openInputDialog}
          userName={userName}
          onSubmit={setUserName}
          onClose={handleInputDialogClose}
        />
      </PageWrapper>
    </PageContainer>
  );
};

export default Vote;
