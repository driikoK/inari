import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#e8dd09',
      contrastText: '#161d16',
    },
    secondary: {
      main: '#ffffff',
      contrastText: '#000000'
    }
  },
  typography: {
    fontFamily: '"Montserrat"',
  },
});

export default theme;