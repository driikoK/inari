import { ReactNode } from 'react';
import {
  HomeOutlined,
  CookieOutlined,
  FormatListBulletedOutlined,
  StarBorderOutlined,
  LightbulbOutlined,
  FolderSpecialOutlined,
  SavingsOutlined,
  PaymentsOutlined,
  MenuBookOutlined,
  SettingsOutlined,
  TableChartOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';

export type NavItemDef = {
  id: string;
  path: string;
  label: string;
  icon: ReactNode;
  // A page outside the site, opened in a new tab
  href?: string;
};

// The sections the current user can open, in the order of the sidebar
export const useNavItems = (): NavItemDef[] => {
  const { isLoggedIn } = useAuthStore();
  const { hasAccess } = usePermissions();

  const isAdmin = hasAccess(SUBJECTS.PERMISSION_EDIT);
  const canManageBudget = hasAccess(SUBJECTS.MANAGE_BUDGET);
  const canAddCrumbs = hasAccess([SUBJECTS.ADD_COOKIES, SUBJECTS.ADD_MEMBERS]);
  const codexUrl = process.env.VITE_CODEX_URL;

  return [
    { id: 'home', path: '/home', label: 'Головна', icon: <HomeOutlined /> },
    ...(isLoggedIn
      ? [
          { id: 'budget', path: '/budget', label: 'Печивко', icon: <SavingsOutlined /> },
          ...(canManageBudget
            ? [
                {
                  id: 'expenses',
                  path: '/budget/expenses',
                  label: 'Видатки',
                  icon: <PaymentsOutlined />,
                },
              ]
            : []),
          ...(canAddCrumbs
            ? [{ id: 'cookie', path: '/cookie', label: 'Крихти', icon: <CookieOutlined /> }]
            : []),
          {
            id: 'cookie-list',
            path: '/cookie/list',
            label: 'Список крихт',
            icon: <FormatListBulletedOutlined />,
          },
          {
            id: 'cookie-rating',
            path: '/cookie/rating',
            label: 'Рейтинг',
            icon: <StarBorderOutlined />,
          },
          {
            id: 'projects',
            path: '/projects',
            label: 'Проєкти',
            icon: <FolderSpecialOutlined />,
          },
          {
            id: 'proposals',
            path: '/proposals',
            label: 'Пропозиції',
            icon: <LightbulbOutlined />,
          },
        ]
      : []),
    ...(process.env.VITE_SHEET_EMBED_URL
      ? [
          {
            id: 'sheet',
            path: '/sheet',
            label: 'Лисяча комора',
            icon: <TableChartOutlined />,
          },
        ]
      : []),
    ...(isLoggedIn && codexUrl
      ? [
          {
            id: 'codex',
            path: codexUrl,
            href: codexUrl,
            label: 'Кодекс Інарі',
            icon: <MenuBookOutlined />,
          },
        ]
      : []),
    ...(isAdmin
      ? [{ id: 'settings', path: '/settings', label: 'Налаштування', icon: <SettingsOutlined /> }]
      : []),
  ];
};
