import { FunctionComponent } from 'react';
import { Container, Title } from './styles';

const Home: FunctionComponent = () => {

  return (
    <Container>
      <div style={{maxWidth: '500px'}}>
        <img src="/fox.jpg" width="100%"/>
      </div>
      <Title>Привіт, Інарчата!</Title>
    </Container>
  );
};

export default Home;
