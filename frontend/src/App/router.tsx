import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import Layout from './Layout';

const Vote = lazy(() => import('./pages/Vote'));
const Result = lazy(() => import('./pages/Result'));
const Cookie = lazy(() => import('./pages/Cookie'));
const Home = lazy(() => import('./pages/Home'));
const CookieRating = lazy(() => import('./pages/CookieRating'));
const CookieList = lazy(() => import('./pages/CookieList'));

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
        element: <Cookie />,
      },
      {
        path: 'cookie/rating',
        element: <CookieRating />,
      },
      {
        path: 'cookie/list',
        element: <CookieList />,
      },
    ],
  },
]);

export default router;
