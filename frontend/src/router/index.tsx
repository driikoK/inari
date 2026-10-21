import { lazy, Suspense } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import { FallbackComponent, Layout } from '@/components';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';

const Vote = lazy(() => import('../pages/Vote'));
const Result = lazy(() => import('../pages/Result'));
const Proposals = lazy(() => import('../pages/Proposals'));
const Sheet = lazy(() => import('../pages/Sheet'));
const Cookie = lazy(() => import('../pages/Cookie'));
const Home = lazy(() => import('../pages/Home'));
const CookieRating = lazy(() => import('../pages/CookieRating'));
const CookieList = lazy(() => import('../pages/CookieList'));
const Auth = lazy(() => import('../pages/Auth'));
const Settings = lazy(() => import('../pages/Settings'));
const Profile = lazy(() => import('../pages/Profile'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

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
          element: <Auth />,
        },
        ...conditionalRoutes(process.env.VITE_FEATURE_POLL === 'true', {
          path: 'vote',
          element: <Vote />,
        }),
        {
          path: 'proposals',
          element: <Proposals />,
        },
        ...conditionalRoutes(
          hasAccess(SUBJECTS.SHOW_RESULTS) || process.env.VITE_FEATURE_RESULTS === 'true',
          {
            path: 'result',
            element: <Result />,
          },
        ),
        ...conditionalRoutes(!!process.env.VITE_SHEET_EMBED_URL, {
          path: 'sheet',
          element: <Sheet />,
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
          path: 'profile',
          element: <Profile />,
        },
        {
          path: 'forgot-password',
          element: <ForgotPassword />,
        },
        {
          path: 'reset/:token',
          element: <ResetPassword />,
        },
        {
          path: '*',
          element: <Auth />,
        },
      ],
    },
  ];

  return routes;
};

export default function Router() {
  const routes = useConditionalRoutes();

  return <Suspense fallback={<FallbackComponent />}>{useRoutes(routes)}</Suspense>;
}
