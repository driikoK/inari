import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import { HeaderContainer, Logo, LogoWrapper, NavButton, NavWrapper } from './styles';
import theme from '@theme';
import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { SUBJECTS } from '@/context/casl';
import { H5 } from '@/components';

const Header: FunctionComponent = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const { hasAccess } = usePermissions();

  const isAdmin = hasAccess(SUBJECTS.PERMISSION_EDIT);

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

  const isShowPoll = process.env.VITE_FEATURE_POLL === 'true';
  const isShowResults = process.env.VITE_FEATURE_RESULTS === 'true';

  return (
    <HeaderContainer>
      <LogoWrapper onClick={() => handleLink('/home')}>
        <Logo />
        <H5 sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Inari</H5>
      </LogoWrapper>
      {isDesktop ? (
        <NavWrapper>
          {isLoggedIn ? (
            <>
              <NavButton onClick={() => handleLink('/cookie')}>Крихти</NavButton>

              {isShowPoll && <NavButton onClick={() => handleLink('/vote')}>Голосування</NavButton>}
              {isShowResults && (
                <NavButton onClick={() => handleLink('/result')}>Результати</NavButton>
              )}
              {isAdmin && (
                <NavButton onClick={() => handleLink('/settings')}>Налаштування</NavButton>
              )}

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
                {isShowPoll && <MenuItem onClick={() => handleLink('/vote')}>Голосування</MenuItem>}
                {isShowResults && (
                  <MenuItem onClick={() => handleLink('/result')}>Результати</MenuItem>
                )}
                {isAdmin && (
                  <MenuItem onClick={() => handleLink('/settings')}>Налаштування</MenuItem>
                )}

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
