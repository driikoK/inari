import { FunctionComponent, useState } from 'react';
import InputCookieDialog from '@/App/dialogs/InputCookieDialog';
import { Container, ElementContainer, ElementImage, Title } from './styles';
import { useNavigate } from 'react-router-dom';
import PasswordDialog from '@/App/dialogs/PasswordDialog';

const Cookie: FunctionComponent = () => {
  const [openCookieDialog, setOpenCookieDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(true);

  const navigate = useNavigate();

  const handleLink = (link: string) => {
    navigate(link);
  };

  return (
    <Container>
      <ElementContainer onClick={() => setOpenCookieDialog(true)}>
        <ElementImage $url='/cookie.png'/>
        <Title>Додати нові крихти</Title>
      </ElementContainer>
      <ElementContainer onClick={ () => handleLink('list') }>
        <ElementImage $url='/general.png'/>
        <Title>Список крихт</Title>
      </ElementContainer>
      <ElementContainer onClick={ () => handleLink('rating') }>
        <ElementImage $url='/roles.png'/>
        <Title>Рейтинг крихт</Title>
      </ElementContainer>
      <InputCookieDialog onClose={() => setOpenCookieDialog(false)} open={openCookieDialog} />
      <PasswordDialog onSubmit={()=> {setOpenPasswordDialog(false);} } onClose={() => {} } open={openPasswordDialog} />
    </Container>
  );
};

export default Cookie;
