import { createContext } from 'react';

export enum SUBJECTS {
  ADD_COOKIES = 'add-cookies',
  ADD_MEMBERS = 'add-members',
  COOKIES_LIST_VIEW = 'cookies-list-view',
  COOKIES_LIST_DELETE = 'cookies-list-delete',
  COOKIES_LIST_UPDATE = 'cookies-list-update',
  RATING_VIEW = 'rating-view',
  PERMISSION_EDIT = 'permissions-edit',
}

export enum ROLE {
  ADMIN = 'admin',
  DIRECTOR = 'director',
  MEMBER = 'member',
}

const ADMIN_PERMISSIONS: SUBJECTS[] = Object.values(SUBJECTS);

const DIRECTOR_PERMISSIONS: SUBJECTS[] = [
  SUBJECTS.ADD_COOKIES,
  SUBJECTS.ADD_MEMBERS,
  SUBJECTS.COOKIES_LIST_VIEW,
  SUBJECTS.RATING_VIEW,
];

const MEMBER_PERMISSIONS: SUBJECTS[] = [SUBJECTS.COOKIES_LIST_VIEW, SUBJECTS.RATING_VIEW];

export const getPermissionsByRole = (role: ROLE): SUBJECTS[] => {
  switch (role) {
    case ROLE.ADMIN:
      return ADMIN_PERMISSIONS;
    case ROLE.DIRECTOR:
      return DIRECTOR_PERMISSIONS;
    case ROLE.MEMBER:
      return MEMBER_PERMISSIONS;
    default:
      return [];
  }
};

type AbilityContextType = {
  permissionsLoaded: boolean;
  setPermissionsLoaded: (val: boolean) => void;
  permissions: SUBJECTS[];
  setPermissions: (list: SUBJECTS[]) => void;
};

export const context: AbilityContextType = {
  permissions: [],
  permissionsLoaded: false,
  setPermissions(list: SUBJECTS[]) {
    context.permissions = list;

    context.permissionsLoaded = true;
  },
  setPermissionsLoaded(val: boolean) {
    context.permissionsLoaded = val;
  },
};

const AbilityContext = createContext({
  permissionsLoaded: false,
  setPermissionsLoaded: () => {},
  permissions: [],
  setPermissions: () => {},
} as AbilityContextType);

export default AbilityContext;
