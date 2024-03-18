import type { FC } from 'react';
import { useEffect } from 'react';
import {
  Outlet, useNavigate, useLocation,
} from 'react-router-dom';
import Header from '../../components/Header';


const Layout: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default Layout;