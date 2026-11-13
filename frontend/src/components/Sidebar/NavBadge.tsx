import { FC } from 'react';
import clsx from 'clsx';
import styles from './Sidebar.module.scss';

const MAX_SHOWN = 99;

export const NavBadge: FC<{ count?: number; collapsed?: boolean }> = ({ count = 0, collapsed }) =>
  count > 0 ? (
    <span className={clsx(styles.badge, collapsed && styles.badgeCollapsed)}>
      {count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}
    </span>
  ) : null;
