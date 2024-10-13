import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import { HeaderContainer, Logo, LogoWrapper, NavButton, NavWrapper, Paragraph } from './styles';
import theme from '@theme';
import useAuthStore from '@/stores/useAuthStore';

const Header: FunctionComponent = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const { isLoggedIn, logout } = useAuthStore();

  const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setOpen(false);
  };

  const handleLink = (link: string) => {
    navigate(link);
    handleCloseMenu();
  };

  const handleLogout = () => {
    logout();
    navigate('/home');
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
          {isLoggedIn ? (
            <>
              <NavButton onClick={() => handleLink('/cookie')}>Крихти</NavButton>
              <NavButton onClick={() => handleLink('/vote')}>Голосування</NavButton>
              <NavButton onClick={handleLogout}>
                Вийти <LogoutIcon sx={{ ml: 1 }} />
              </NavButton>
            </>
          ) : (
            <NavButton onClick={() => handleLink('/login')}>
              Увійти <LoginIcon sx={{ ml: 1 }} />
            </NavButton>
          )}
        </NavWrapper>
      ) : (
        <>
          {isLoggedIn ? (
            <>
              <IconButton onClick={handleClickMenu}>
                <MenuIcon color="secondary" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
                <MenuItem onClick={() => handleLink('/cookie')}>Крихти</MenuItem>
                <MenuItem onClick={() => handleLink('/vote')}>Голосування</MenuItem>
                <MenuItem onClick={handleLogout}>
                  Вийти <LogoutIcon sx={{ ml: 1 }} />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <NavButton onClick={() => handleLink('/login')}>
              Увійти <LoginIcon sx={{ ml: 1 }} />
            </NavButton>
          )}
        </>
      )}
    </HeaderContainer>
  );
};

export default Header;
