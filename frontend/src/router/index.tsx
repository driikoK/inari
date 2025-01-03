import { lazy } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import { Layout } from '@/components';

const Vote = lazy(() => import('../App/pages/Vote'));
const Result = lazy(() => import('../App/pages/Result'));
const Cookie = lazy(() => import('../App/pages/Cookie'));
const Home = lazy(() => import('../App/pages/Home'));
const CookieRating = lazy(() => import('../App/pages/CookieRating'));
const CookieList = lazy(() => import('../App/pages/CookieList'));
const Login = lazy(() => import('../App/pages/Login'));
const Settings = lazy(() => import('../App/pages/Settings'));

const conditionalRoutes = (condition: boolean, route: RouteObject) => (condition ? [route] : []);

const routes: RouteObject[] = [
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
      ...conditionalRoutes(process.env.VITE_FEATURE_POLL === 'true', {
        path: 'vote',
        element: <Vote />,
      }),
      ...conditionalRoutes(process.env.VITE_FEATURE_RESULTS === 'true', {
        path: 'result',
        element: <Result />,
      }),
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
        path: 'settings',
        element: <Settings />,
      },
      {
        path: '*',
        element: <Home />,
      },
    ],
  },
];
export default function Router() {
  return useRoutes(routes);
}
