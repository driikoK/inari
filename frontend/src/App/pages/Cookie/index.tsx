import { FunctionComponent, useState } from 'react';
import InputCookieDialog from '@/App/dialogs/InputCookieDialog';
import { Container, ElementContainer, ElementImage, Title } from './styles';
import { useNavigate } from 'react-router-dom';

const Cookie: FunctionComponent = () => {
  const [openDialog, setOpenDialog] = useState(false);

  const navigate = useNavigate();

  const handleLink = (link: string) => {
    navigate(link);
  };

  return (
    <Container>
      <ElementContainer onClick={() => setOpenDialog(true)}>
        <ElementImage $url='/cookie.png'/>
        <Title>Додати нові крихти</Title>
      </ElementContainer>
      <ElementContainer onClick={ () => handleLink('general') }>
        <ElementImage $url='/general.png'/>
        <Title>Загальний топ</Title>
      </ElementContainer>
      <ElementContainer onClick={ () => handleLink('roles') }>
        <ElementImage $url='/roles.png'/>
        <Title>Топ по ролях</Title>
      </ElementContainer>
      <InputCookieDialog onClose={() => setOpenDialog(false)} open={openDialog} />
    </Container>
  );
};

export default Cookie;
