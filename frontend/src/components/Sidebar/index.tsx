import { FC, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, useMediaQuery } from '@mui/material';
import clsx from 'clsx';
import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';
import styles from './Sidebar.module.scss';
import {
  HomeOutlined,
  CookieOutlined,
  FormatListBulletedOutlined,
  StarBorderOutlined,
  LeaderboardOutlined,
  LightbulbOutlined,
  FolderSpecialOutlined,
  SavingsOutlined,
  PaymentsOutlined,
  AutoGraphOutlined,
  SettingsOutlined,
  Person2Outlined,
  LogoutOutlined,
  TableChartOutlined,
} from '@mui/icons-material';

export const SIDEBAR_FULL_W = 200;
export const SIDEBAR_MINI_W = 68;
export const SIDEBAR_BREAKPOINT = '(max-width: 900px)';

type NavItemDef = {
  id: string;
  path: string;
  label: string;
  icon: ReactNode;
};

const Sidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isLoggedIn } = useAuthStore();
  const { hasAccess } = usePermissions();

  const collapsed = useMediaQuery(SIDEBAR_BREAKPOINT);
  const isAdmin = hasAccess(SUBJECTS.PERMISSION_EDIT);
  const canManageBudget = hasAccess(SUBJECTS.MANAGE_BUDGET);
  const isShowPoll = process.env.VITE_FEATURE_POLL === 'true';
  const isShowResults =
    hasAccess(SUBJECTS.SHOW_RESULTS) || process.env.VITE_FEATURE_RESULTS === 'true';

  const navItems: NavItemDef[] = [
    { id: 'home', path: '/home', label: 'Головна', icon: <HomeOutlined /> },
    ...(isLoggedIn
      ? [
          { id: 'cookie', path: '/cookie', label: 'Крихти', icon: <CookieOutlined /> },
          {
            id: 'cookie-list',
            path: '/cookie/list',
            label: 'Список крихт',
            icon: <FormatListBulletedOutlined />,
          },
          {
            id: 'cookie-rating',
            path: '/cookie/rating',
            label: 'Рейтинг',
            icon: <StarBorderOutlined />,
          },
        ]
      : []),
    ...(process.env.VITE_SHEET_EMBED_URL
      ? [
          {
            id: 'sheet',
            path: '/sheet',
            label: 'Лисяча комора',
            icon: <TableChartOutlined />,
          },
        ]
      : []),
    ...(isLoggedIn
      ? [
          {
            id: 'proposals',
            path: '/proposals',
            label: 'Пропозиції',
            icon: <LightbulbOutlined />,
          },
          {
            id: 'projects',
            path: '/projects',
            label: 'Проєкти',
            icon: <FolderSpecialOutlined />,
          },
          {
            id: 'budget',
            path: '/budget',
            label: 'Печивко',
            icon: <SavingsOutlined />,
          },
          ...(canManageBudget
            ? [
                {
                  id: 'expenses',
                  path: '/budget/expenses',
                  label: 'Видатки',
                  icon: <PaymentsOutlined />,
                },
              ]
            : []),
        ]
      : []),
    ...(isShowPoll
      ? [{ id: 'vote', path: '/vote', label: 'Голосування', icon: <LeaderboardOutlined /> }]
      : []),
    ...(isShowResults
      ? [{ id: 'result', path: '/result', label: 'Результати', icon: <AutoGraphOutlined /> }]
      : []),
    ...(isAdmin
      ? [{ id: 'settings', path: '/settings', label: 'Налаштування', icon: <SettingsOutlined /> }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navBtnClass = (path: string) =>
    clsx(styles.navBtn, isActive(path) && styles.navBtnActive, collapsed && styles.navBtnCollapsed);

  const bottomBtnClass = (...extra: string[]) =>
    clsx(styles.navBtn, collapsed && styles.navBtnCollapsed, ...extra);

  return (
    <aside
      className={[styles.sidebar, collapsed && styles.sidebarCollapsed].filter(Boolean).join(' ')}
    >
      <div className={styles.logoRow}>
        <div className={styles.logoAvatar}>
          <img src="/logo.jpg" className={styles.logoImg} alt="Inari" />
        </div>
        {!collapsed && <span className={styles.logoName}>Inari</span>}
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={navBtnClass(item.path)}
            startIcon={collapsed ? undefined : item.icon}
            fullWidth
          >
            {collapsed ? item.icon : item.label}
          </Button>
        ))}
      </nav>

      <div className={styles.bottomSection}>
        <Button
          onClick={() => navigate('/profile')}
          className={navBtnClass('/profile')}
          startIcon={collapsed ? undefined : <Person2Outlined />}
          fullWidth
        >
          {collapsed ? <Person2Outlined /> : 'Профіль'}
        </Button>
        <Button
          onClick={handleLogout}
          className={bottomBtnClass(styles.logoutBtn)}
          startIcon={collapsed ? undefined : <LogoutOutlined />}
          fullWidth
        >
          {collapsed ? <LogoutOutlined /> : 'Вийти'}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
