import { useCallback, useContext, useEffect } from 'react';
import AbilityContext, { getPermissionsByRole, SUBJECTS } from '@/context/casl';
import { useAuthStore } from '@/stores';

const usePermissions = () => {
  const { setPermissions, setPermissionsLoaded, permissions, permissionsLoaded } =
    useContext(AbilityContext);
  const { user } = useAuthStore();

  const hasAccess = useCallback(
    (permission: SUBJECTS) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const checkAccessFn = useCallback(
    (permission: SUBJECTS | SUBJECTS[]) => {
      if (!permission) return true;

      if (Array.isArray(permission)) return permission.some(hasAccess);

      return hasAccess(permission);
    },
    [hasAccess]
  );

  useEffect(() => {
    if (user?.role) {
      setPermissions(getPermissionsByRole(user.role));

      setPermissionsLoaded(true);
    }
  }, [user, setPermissions]);

  return {
    permissionsLoaded,
    permissions,
    hasAccess: checkAccessFn,
  };
};

export default usePermissions;
