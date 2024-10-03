import { FunctionComponent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container, ElementContainer, ElementImage, Title } from './styles';
import InputCookieDialog from '@/App/dialogs/InputCookieDialog';
import PasswordDialog from '@/App/dialogs/PasswordDialog';
import { CreateAnimeAndMemberDialog } from '@/App/dialogs/CreateAnimeAndMemberDialog';

const Cookie: FunctionComponent = () => {
  const [openCookieDialog, setOpenCookieDialog] = useState(false);
  const [openAddUsersAndTitlesDialog, setOpenAddUsersAndTitlesDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(true);

  const navigate = useNavigate();

  const handleSubmitPassword = () => {
    sessionStorage.setItem('password', 'true');
    setOpenPasswordDialog(false);
  };

  const isPasswordEntered = sessionStorage.getItem('password') === 'true';

  const handleLink = (link: string) => {
    navigate(link);
  };

  return (
    <Container>
      {openPasswordDialog && !isPasswordEntered ? (
        <PasswordDialog
          onSubmit={handleSubmitPassword}
          onClose={() => {}}
          open={openPasswordDialog}
        />
      ) : (
        <>
          <ElementContainer onClick={() => setOpenCookieDialog(true)}>
            <ElementImage $url="/cookie.png" />
            <Title>Додати нові крихти</Title>
          </ElementContainer>
          <ElementContainer onClick={() => setOpenAddUsersAndTitlesDialog(true)}>
            <ElementImage $url="/foxes.png" />
            <Title>Додати в лисятник</Title>
          </ElementContainer>
          <ElementContainer onClick={() => handleLink('list')}>
            <ElementImage $url="/general.png" />
            <Title>Список крихт</Title>
          </ElementContainer>
          <ElementContainer onClick={() => handleLink('rating')}>
            <ElementImage $url="/roles.png" />
            <Title>Рейтинг крихт</Title>
          </ElementContainer>
          {openCookieDialog && (
            <InputCookieDialog onClose={() => setOpenCookieDialog(false)} open={openCookieDialog} />
          )}
          {openAddUsersAndTitlesDialog && (
            <CreateAnimeAndMemberDialog
              onClose={() => setOpenAddUsersAndTitlesDialog(false)}
              open={openAddUsersAndTitlesDialog}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default Cookie;
