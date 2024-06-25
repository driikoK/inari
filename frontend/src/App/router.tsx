import { createBrowserRouter } from 'react-router-dom';
import Vote from './pages/Vote';
import Layout from './Layout';
import Result from './pages/Result';
import Cookie from './pages/Cookie';
import Home from './pages/Home';
import CookieRating from './pages/CookieRating';
import CookieList from './pages/CookieList';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'vote',
        element: <Vote />,
      },
      {
        path: 'result',
        element: <Result />,
      },
      {
        path: 'cookie',
        element: <Cookie />
      },
      {
        path: 'cookie/rating',
        element: <CookieRating />
      },
      {
        path: 'cookie/list',
        element: <CookieList />
      }
    ],
  },
]);

export default router;