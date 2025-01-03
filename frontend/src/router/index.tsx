import { lazy } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';

import { Layout } from '@/components';

const lazyImport = (path: string) => lazy(() => import(`../App/pages/${path}`));

const Vote = lazyImport('Vote');
const Result = lazyImport('Result');
const Cookie = lazyImport('Cookie');
const Home = lazyImport('Home');
const CookieRating = lazyImport('CookieRating');
const CookieList = lazyImport('CookieList');
const Login = lazyImport('Login');
const Settings = lazyImport('Settings');

const conditionalRoutes = (condition: boolean, route: RouteObject) => (condition ? [route] : []);

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'home', element: <Home /> },
      { path: 'login', element: <Login /> },
      ...conditionalRoutes(process.env.VITE_FEATURE_POLL === 'true', {
        path: 'vote',
        element: <Vote />,
      }),
      ...conditionalRoutes(process.env.VITE_FEATURE_RESULTS === 'true', {
        path: 'result',
        element: <Result />,
      }),
      { path: 'cookie', element: <Cookie /> },
      { path: 'cookie/rating', element: <CookieRating /> },
      { path: 'cookie/list', element: <CookieList /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Home /> },
    ],
  },
];

export default function Router() {
  return useRoutes(routes);
}
