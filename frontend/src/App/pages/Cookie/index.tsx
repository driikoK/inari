import { FC, FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Skeleton from '@mui/material/Skeleton';

import { Container, ElementContainer, ElementImage, Title } from './styles';
import InputCookieDialog from '@/App/dialogs/InputCookieDialog';
import { CreateAnimeAndMemberDialog } from '@/App/dialogs/CreateAnimeAndMemberDialog';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/App/hooks/usePermissions';

const Cookie: FunctionComponent = () => {
  const [openCookieDialog, setOpenCookieDialog] = useState(false);
  const [openAddUsersAndTitlesDialog, setOpenAddUsersAndTitlesDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({
    cookie: false,
    foxes: false,
    general: false,
    roles: false,
  });

  const isAllImagesLoaded =
    imageLoaded.cookie && imageLoaded.foxes && imageLoaded.general && imageLoaded.roles;

  const navigate = useNavigate();

  const handleLink = (link: string) => {
    navigate(link);
  };

  const { hasAccess } = usePermissions();

  const preloadImage = (imageKey: string, imageUrl: string) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setImageLoaded((prev) => ({ ...prev, [imageKey]: true }));
  };

  useEffect(() => {
    preloadImage('cookie', '/cookie.png');
    preloadImage('foxes', '/foxes.png');
    preloadImage('general', '/general.png');
    preloadImage('roles', '/roles.png');
  }, []);

  return (
    <Container>
      {hasAccess(SUBJECTS.ADD_COOKIES) && (
        <Card
          isLoaded={isAllImagesLoaded}
          onClick={() => setOpenCookieDialog(true)}
          imgUrl="/cookie.png"
          title="Додати нові крихти"
        />
      )}

      {hasAccess(SUBJECTS.ADD_MEMBERS) && (
        <Card
          isLoaded={isAllImagesLoaded}
          onClick={() => setOpenAddUsersAndTitlesDialog(true)}
          imgUrl="/foxes.png"
          title="Додати в лисятник"
        />
      )}

      <Card
        isLoaded={isAllImagesLoaded}
        onClick={() => handleLink('list')}
        imgUrl="/general.png"
        title="Список крихт"
      />

      <Card
        isLoaded={isAllImagesLoaded}
        onClick={() => handleLink('rating')}
        imgUrl="/roles.png"
        title="Рейтинг крихт"
      />

      {openCookieDialog && (
        <InputCookieDialog onClose={() => setOpenCookieDialog(false)} open={openCookieDialog} />
      )}
      {openAddUsersAndTitlesDialog && (
        <CreateAnimeAndMemberDialog
          onClose={() => setOpenAddUsersAndTitlesDialog(false)}
          open={openAddUsersAndTitlesDialog}
        />
      )}
    </Container>
  );
};

export default Cookie;

type Props = {
  isLoaded: boolean;
  onClick: () => void;
  imgUrl: string;
  title: string;
};

const Card: FC<Props> = ({ isLoaded, onClick, imgUrl, title }) => {
  return (
    <ElementContainer onClick={onClick}>
      {!isLoaded ? (
        <Skeleton variant="rectangular" width={220} height={200} />
      ) : (
        <ElementImage $url={imgUrl} />
      )}
      <Title>{title}</Title>
    </ElementContainer>
  );
};
