import facepaint from 'facepaint';

const colors = {
  title: '#252d3a',
  background: '#161d16',
  link: '#d2ddff',
  yellow: '#e8dd09',
  gray: '#343a42',
};

const font = {
  family: {
    montserrat: '"Montserrat", sans-serif',
  },
};

export type TColors = keyof typeof colors;

const screens = {
  mobile: '@media(min-width: 320px)',
  tablet: '@media(min-width: 920px)',
  desktop: '@media(min-width: 1120px)',
};

const mq = facepaint([screens.mobile, screens.tablet, screens.desktop]);

const theme = {
  colors,
  font,
  screens,
  mq,
};

export default theme;

export type ThemeType = typeof theme;
