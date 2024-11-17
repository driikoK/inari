import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    primary: {
      main: '#e8dd09',
      contrastText: '#161d16',
    },
    secondary: {
      main: '#ffffff',
      contrastText: '#000000',
    },
    warning: {
      main: '#ff0000',
    },
  },
  typography: {
    fontFamily: '"Montserrat"',
    subtitle1: {
      fontStyle: 'normal',
      fontWeight: 500,
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
