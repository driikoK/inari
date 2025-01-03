import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { ThemeProvider as MuiThemeProvider } from '@mui/material';

import Router from '../router';
import muiTheme from '../mui-theme';
import theme from '../theme.ts';
import { useAuthStore } from '@/stores';
import AbilityContext, { SUBJECTS } from '@/context/casl';
import { FallbackComponent } from '@/components';

function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { isLoggedIn, getCurrentUser, user } = useAuthStore();

  const pathname = location.pathname;
  const isPathForUnloggedUser = pathname === '/login' || pathname === '/home';

  if (!isPathForUnloggedUser && !isLoggedIn) {
    window.location.replace('/login');
  }

  useEffect(() => {
    if (!isPathForUnloggedUser) getCurrentUser();
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
    [permissionLoaded, permissions]
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
