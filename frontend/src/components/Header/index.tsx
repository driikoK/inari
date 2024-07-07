import { FunctionComponent, useState } from 'react';
import {
  HeaderContainer,
  Logo,
  LogoWrapper,
  NavButton,
  NavWrapper,
  Paragraph,
} from './styles';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';
import theme from '@theme';
import MenuIcon from '@mui/icons-material/Menu';

const Header: FunctionComponent = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const navigate = useNavigate();

  const handleLink = (link: string) => {
    navigate(link);
    handleCloseMenu();
  };

  const isDesktop = useMediaQuery(theme.screens.desktop);

  return (
    <HeaderContainer>
      <LogoWrapper onClick={() => handleLink('/home')}>
        <Logo />
        <Paragraph>Inari</Paragraph>
      </LogoWrapper>
      {isDesktop ? (
        <NavWrapper>
          <NavButton onClick={() => handleLink('/cookie')}>Крихти</NavButton>
          <NavButton onClick={() => handleLink('/vote')}>Голосування</NavButton>
        </NavWrapper>
      ) : (
        <IconButton onClick={handleClickMenu}>
          <MenuIcon color="secondary" />
        </IconButton>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleLink('/cookie')}>Крихти</MenuItem>
        <MenuItem onClick={() => handleLink('/vote')}>Голосування</MenuItem>
      </Menu>
    </HeaderContainer>
  );
};

export default Header;
