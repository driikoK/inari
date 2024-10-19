import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { ThemeProvider as MuiThemeProvider } from '@mui/material';

import Router from './router';
import muiTheme from '../mui-theme';
import theme from '../theme.ts';
import useAuthStore from '@/stores/useAuthStore';
import AbilityContext, { SUBJECTS } from '@/context/casl';

function App() {
  const { isLoggedIn, getCurrentUser } = useAuthStore();
  const location = useLocation();
  const pathname = location.pathname;
  const isPathForUnloggedUser = pathname === '/login' || pathname === '/home';

  if (!isPathForUnloggedUser && !isLoggedIn) {
    window.location.replace('/login');
  }

  const [permissions, setPermissions] = useState<SUBJECTS[]>([]);
  const [permissionLoaded, setPermissionLoaded] = useState<boolean>(false);

  const permissionsContextValue = useMemo(
    () => ({
      permissionsLoaded: permissionLoaded,
      setPermissionsLoaded: setPermissionLoaded,
      permissions,
      setPermissions,
    }),
    [permissionLoaded, permissions]
  );

  useEffect(() => {
    if (!isPathForUnloggedUser) getCurrentUser();
  }, [pathname]);

  return (
    <AbilityContext.Provider value={permissionsContextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>
          <Router />
        </ThemeProvider>
      </MuiThemeProvider>
    </AbilityContext.Provider>
  );
}

export default App;
