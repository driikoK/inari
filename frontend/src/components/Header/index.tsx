import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';

import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';
import { H5, CustomBreadcrumbs } from '@/components';
import styles from './Header.module.scss';

const Header: FunctionComponent = () => {
  const navigate = useNavigate();
  const { hasAccess } = usePermissions();

  const isAdmin = hasAccess(SUBJECTS.PERMISSION_EDIT);
  const canManageBudget = hasAccess(SUBJECTS.MANAGE_BUDGET);

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
    { title: 'Пропозиції', link: '/proposals' },
    { title: 'Проєкти', link: '/projects' },
    { title: 'Печивко', link: '/budget' },
    canManageBudget ? { title: 'Видатки', link: '/budget/expenses' } : null,
    isShowPoll ? { title: 'Голосування', link: '/vote' } : null,
    isShowResults ? { title: 'Результати', link: '/result' } : null,
    isAdmin ? { title: 'Налаштування', link: '/settings' } : null,
    { title: 'Профіль', link: '/profile' },
    {
      title: 'Вийти',
      link: '/logout',
      icon: <LogoutIcon />,
      onClick: handleLogout,
    },
  ];

  const loggedOutLinks = [{ title: 'Увійти', link: '/login', icon: <LoginIcon /> }];

  return (
    <div className={styles.headerContainer}>
      <div className={styles.logoWrapper} onClick={() => navigate('/home')}>
        <div className={styles.logo} />
        <H5 sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Inari</H5>
      </div>

      <div className={styles.navWrapper}>
        {isLoggedIn ? (
          <CustomBreadcrumbs links={loggedInLinks} />
        ) : (
          <CustomBreadcrumbs links={loggedOutLinks} />
        )}
      </div>
    </div>
  );
};

export default Header;
