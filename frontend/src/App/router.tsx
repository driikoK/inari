import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import Layout from './Layout';

const Vote = lazy(() => import('./pages/Vote'));
const Result = lazy(() => import('./pages/Result'));
const Cookie = lazy(() => import('./pages/Cookie'));
const Home = lazy(() => import('./pages/Home'));
const CookieRating = lazy(() => import('./pages/CookieRating'));
const CookieList = lazy(() => import('./pages/CookieList'));
const Login = lazy(() => import('./pages/Login'));

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
        path: 'login',
        element: <Login />,
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
      {
        path: '*',
        element: <Home />,
      },
    ],
  },
]);

export default router;
