import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';

import { HeaderContainer, Logo, LogoWrapper, NavButton, NavWrapper, Paragraph } from './styles';
import theme from '@theme';
const Header: FunctionComponent = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState<boolean>(false);

  const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setOpen(false);
  };

  const navigate = useNavigate();

  const handleLink = (link: string) => {
    navigate(link);
    handleCloseMenu();
  };

  const isDesktop = useMediaQuery(theme.screens.desktop);

  useEffect(() => {
    handleCloseMenu();
  }, [isDesktop]);

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
        <>
          <IconButton onClick={handleClickMenu}>
            <MenuIcon color="secondary" />
          </IconButton>

          <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
            <MenuItem onClick={() => handleLink('/cookie')}>Крихти</MenuItem>
            <MenuItem onClick={() => handleLink('/vote')}>Голосування</MenuItem>
          </Menu>
        </>
      )}
    </HeaderContainer>
  );
};

export default Header;
