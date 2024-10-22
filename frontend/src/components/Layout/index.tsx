import { FC, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import Header from '../Header';

const Layout: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/home');
    }
  }, []);

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default Layout;
