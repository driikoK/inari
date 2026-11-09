import { FC, PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import FallbackComponent from '../Fallback';

interface RequireAccessProps {
  subjects: SUBJECTS[];
  redirectTo?: string;
}

export const RequireAccess: FC<PropsWithChildren<RequireAccessProps>> = ({
  subjects,
  redirectTo = '/home',
  children,
}) => {
  const { permissionsLoaded, hasAccess } = usePermissions();

  if (!permissionsLoaded) return <FallbackComponent />;

  return hasAccess(subjects) ? children : <Navigate to={redirectTo} replace />;
};
