import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { ThemeProvider as MuiThemeProvider } from '@mui/material';

import Router from './router/index.tsx';
import muiTheme from './theme/mui-theme.ts';
import theme from './theme/theme.ts';
import { useAuthStore } from '@/stores';
import AbilityContext, { SUBJECTS } from '@/context/casl';
import { FallbackComponent } from '@/components';

const PATHS_FOR_UNLOGGED_USER = ['/login', '/home', '/forgot-password', '/sign-up'];

function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { isLoggedIn, getCurrentUser, user } = useAuthStore();

  const pathname = location.pathname;
  const isPathForUnloggedUser =
    PATHS_FOR_UNLOGGED_USER.includes(pathname) || pathname.startsWith('/reset/');

  if (!isPathForUnloggedUser && !isLoggedIn) {
    window.location.replace('/login');
  }

  // The home page is open to guests, but a logged-in user needs their role there too
  const needsUser = !isPathForUnloggedUser || (isLoggedIn && pathname === '/home');

  useEffect(() => {
    if (needsUser) getCurrentUser();
  }, [pathname]);

  if (!user && !isPathForUnloggedUser) return <FallbackComponent />;

  return children;
}

function App() {
  const [permissions, setPermissions] = useState<SUBJECTS[]>([]);
  const [permissionLoaded, setPermissionLoaded] = useState<boolean>(false);

  const permissionsContextValue = useMemo(
    () => ({
      permissionsLoaded: permissionLoaded,
      setPermissionsLoaded: setPermissionLoaded,
      permissions,
      setPermissions,
    }),
    [permissionLoaded, permissions],
  );

  return (
    <AbilityContext.Provider value={permissionsContextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>
          <RequireAuth>
            <Router />
          </RequireAuth>
        </ThemeProvider>
      </MuiThemeProvider>
    </AbilityContext.Provider>
  );
}

export default App;
