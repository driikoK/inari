import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, useMediaQuery } from '@mui/material';
import clsx from 'clsx';
import { useAuthStore } from '@/stores';
import styles from './Sidebar.module.scss';
import { useNavItems } from './useNavItems';
import { OpenInNewOutlined, Person2Outlined, LogoutOutlined } from '@mui/icons-material';

export const SIDEBAR_FULL_W = 200;
export const SIDEBAR_MINI_W = 68;
export const SIDEBAR_BREAKPOINT = '(max-width: 900px)';

const Sidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const navItems = useNavItems();

  const collapsed = useMediaQuery(SIDEBAR_BREAKPOINT);

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
        {navItems.map((item) =>
          item.href ? (
            <Button
              key={item.id}
              component="a"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={navBtnClass(item.path)}
              startIcon={collapsed ? undefined : item.icon}
              endIcon={collapsed ? undefined : <OpenInNewOutlined sx={{ fontSize: 14 }} />}
              title={collapsed ? item.label : undefined}
              fullWidth
            >
              {collapsed ? item.icon : item.label}
            </Button>
          ) : (
            <Button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={navBtnClass(item.path)}
              startIcon={collapsed ? undefined : item.icon}
              fullWidth
            >
              {collapsed ? item.icon : item.label}
            </Button>
          ),
        )}
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
