import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';

import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import { HeaderContainer, Logo, LogoWrapper, NavWrapper } from './styles';
import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';
import { H5, CustomBreadcrumbs } from '@/components';

const Header: FunctionComponent = () => {
  const navigate = useNavigate();
  const { hasAccess } = usePermissions();

  const isAdmin = hasAccess(SUBJECTS.PERMISSION_EDIT);

  const { isLoggedIn, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const isShowPoll = process.env.VITE_FEATURE_POLL === 'true';
  const isShowResults =
    hasAccess(SUBJECTS.SHOW_RESULTS) || process.env.VITE_FEATURE_RESULTS === 'true';

  const loggedInLinks = [
    { title: 'Крихти', link: '/cookie' },
    isShowPoll ? { title: 'Голосування', link: '/vote' } : null,
    isShowResults ? { title: 'Результати', link: '/result' } : null,
    isAdmin ? { title: 'Налаштування', link: '/settings' } : null,
    { title: 'Профіль', link: '/profile' },
    {
      title: 'Вийти',
      link: '/logout',
      icon: <LogoutIcon />,
      onClick: handleLogout,
    },
  ];

  const loggedOutLinks = [{ title: 'Увійти', link: '/login', icon: <LoginIcon /> }];

  return (
    <HeaderContainer>
      <LogoWrapper onClick={() => navigate('/home')}>
        <Logo />
        <H5 sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Inari</H5>
      </LogoWrapper>

      <NavWrapper>
        {isLoggedIn ? (
          <CustomBreadcrumbs links={loggedInLinks} />
        ) : (
          <CustomBreadcrumbs links={loggedOutLinks} />
        )}
      </NavWrapper>
    </HeaderContainer>
  );
};

export default Header;
