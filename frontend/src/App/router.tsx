import { createBrowserRouter } from 'react-router-dom';
import Vote from './pages/Vote';
import Layout from './Layout';
import Result from './pages/Result';
import Cookie from './pages/Cookie';
import RolesRating from './pages/RolesRating';
import GeneralRating from './pages/GeneralRating';
import Home from './pages/Home';


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
        path: 'cookie/roles',
        element: <RolesRating />
      },
      {
        path: 'cookie/general',
        element: <GeneralRating />
      }
    ],
  },
]);

export default router;