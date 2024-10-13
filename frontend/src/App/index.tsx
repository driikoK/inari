import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import muiTheme from '../mui-theme';
import theme from '../theme.ts';
import router from './router';
import useAuthStore from '@/stores/useAuthStore.ts';

function App() {
  const { isLoggedIn } = useAuthStore();
  const pathname = window.location.pathname;

  if (pathname !== '/login' && pathname !== '/home' && !isLoggedIn) {
    window.location.replace('/login');
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </MuiThemeProvider>
  );
}

export default App;
