import { FunctionComponent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container, ElementContainer, ElementImage, Title } from './styles';
import InputCookieDialog from '@/App/dialogs/InputCookieDialog';
import { CreateAnimeAndMemberDialog } from '@/App/dialogs/CreateAnimeAndMemberDialog';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/App/hooks/usePermissions';

const Cookie: FunctionComponent = () => {
  const [openCookieDialog, setOpenCookieDialog] = useState(false);
  const [openAddUsersAndTitlesDialog, setOpenAddUsersAndTitlesDialog] = useState(false);

  const { hasAccess } = usePermissions();

  const navigate = useNavigate();

  const handleLink = (link: string) => {
    navigate(link);
  };

  return (
    <Container>
      <>
        {hasAccess(SUBJECTS.ADD_COOKIES) && (
          <ElementContainer onClick={() => setOpenCookieDialog(true)}>
            <ElementImage $url="/cookie.png" />
            <Title>Додати нові крихти</Title>
          </ElementContainer>
        )}

        {hasAccess(SUBJECTS.ADD_MEMBERS) && (
          <ElementContainer onClick={() => setOpenAddUsersAndTitlesDialog(true)}>
            <ElementImage $url="/foxes.png" />
            <Title>Додати в лисятник</Title>
          </ElementContainer>
        )}

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
    </Container>
  );
};

export default Cookie;
