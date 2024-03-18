import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#e8dd09',
      contrastText: '#161d16',
    },
  },
  typography: {
    fontFamily: '"Montserrat"',
  },
});

export default theme;