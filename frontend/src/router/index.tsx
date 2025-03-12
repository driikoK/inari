import { lazy } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import { Layout } from '@/components';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';

const Vote = lazy(() => import('../pages/Vote'));
const Result = lazy(() => import('../pages/Result'));
const Cookie = lazy(() => import('../pages/Cookie'));
const Home = lazy(() => import('../pages/Home'));
const CookieRating = lazy(() => import('../pages/CookieRating'));
const CookieList = lazy(() => import('../pages/CookieList'));
const Login = lazy(() => import('../pages/Login'));
const Settings = lazy(() => import('../pages/Settings'));

const conditionalRoutes = (condition: boolean, route: RouteObject) => (condition ? [route] : []);

const useConditionalRoutes = () => {
  const { hasAccess } = usePermissions();

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
        ...conditionalRoutes(
          hasAccess(SUBJECTS.SHOW_RESULTS) || process.env.VITE_FEATURE_RESULTS === 'true',
          {
            path: 'result',
            element: <Result />,
          }
        ),
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

  return routes;
};

export default function Router() {
  const routes = useConditionalRoutes();
  return useRoutes(routes);
}
