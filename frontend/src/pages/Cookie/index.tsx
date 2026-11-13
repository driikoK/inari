import { FC, FunctionComponent, useEffect, useState } from 'react';

import Skeleton from '@mui/material/Skeleton';

import { Container, ElementContainer, ElementImage, ElementContent, ElementTitle } from './styles';
import { AddMemberDialog, InputCookieDialog } from '@/pages/Cookie/components';
import { ProjectFormDialog } from '@/pages/Projects/components/ProjectFormDialog';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import s from './Cookie.module.scss';

const IMAGES = {
  cookie: '/cookie.png',
  foxes: '/foxes.png',
  fox: '/fox.jpg',
};

const Cookie: FunctionComponent = () => {
  const [openCookieDialog, setOpenCookieDialog] = useState(false);
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({
    cookie: false,
    foxes: false,
    fox: false,
  });

  const isAllImagesLoaded = imageLoaded.cookie && imageLoaded.foxes && imageLoaded.fox;

  const { hasAccess } = usePermissions();

  const preloadImage = (imageKey: string, imageUrl: string) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setImageLoaded((prev) => ({ ...prev, [imageKey]: true }));
  };

  useEffect(() => {
    preloadImage('cookie', IMAGES.cookie);
    preloadImage('foxes', IMAGES.foxes);
    preloadImage('fox', IMAGES.fox);
  }, []);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerTitle}>Крихти</div>
        <div className={s.headerSubtitle}>Записуй крихти, додавай учасників і створюй проєкти</div>
      </div>

      <Container>
        {hasAccess(SUBJECTS.ADD_COOKIES) && (
          <Card
            isLoaded={isAllImagesLoaded}
            onClick={() => setOpenCookieDialog(true)}
            imgUrl={IMAGES.cookie}
            title="Додати крихти"
            description="Записати нові крихти учасника"
          />
        )}

        {hasAccess(SUBJECTS.ADD_MEMBERS) && (
          <Card
            isLoaded={isAllImagesLoaded}
            onClick={() => setOpenAddMemberDialog(true)}
            imgUrl={IMAGES.foxes}
            title="Додати учасника"
            description="Новий учасник або гість"
          />
        )}

        {hasAccess(SUBJECTS.MANAGE_PROJECTS) && (
          <Card
            isLoaded={isAllImagesLoaded}
            onClick={() => setOpenProjectDialog(true)}
            imgUrl={IMAGES.fox}
            title="Створити проєкт"
            description="Новий тайтл для запису крихт"
          />
        )}
      </Container>

      {openCookieDialog && (
        <InputCookieDialog onClose={() => setOpenCookieDialog(false)} open={openCookieDialog} />
      )}
      {openAddMemberDialog && (
        <AddMemberDialog onClose={() => setOpenAddMemberDialog(false)} open={openAddMemberDialog} />
      )}
      {openProjectDialog && <ProjectFormDialog open onClose={() => setOpenProjectDialog(false)} />}
    </div>
  );
};

export default Cookie;

type Props = {
  isLoaded: boolean;
  onClick: () => void;
  imgUrl: string;
  title: string;
  description: string;
};

const Card: FC<Props> = ({ isLoaded, onClick, imgUrl, title, description }) => {
  return (
    <ElementContainer onClick={onClick}>
      {!isLoaded ? (
        <Skeleton variant="rectangular" width={250} height={180} />
      ) : (
        <ElementImage $url={imgUrl} />
      )}
      <ElementContent>
        <ElementTitle>{title}</ElementTitle>
        <div className={s.cardDescription}>{description}</div>
        <div className={s.cardLink}>Відкрити →</div>
      </ElementContent>
    </ElementContainer>
  );
};
