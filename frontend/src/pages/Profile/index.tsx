import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

import { useAuthStore } from '@/stores';
import { userRoleOptions } from '@/utils/constants';
import { ROLE } from '@/context/casl';
import styles from './Profile.module.scss';

const ROLE_COLOR: Record<string, string> = {
  [ROLE.ADMIN]: 'var(--accent)',
  [ROLE.DIRECTOR]: 'var(--teal)',
  [ROLE.MEMBER]: 'var(--text-muted)',
};

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');

  const handleSaveEmail = async () => {
    try {
      await updateUser(user!._id, user!.role, email);
      toast.success('Успішно оновлено');
    } catch {}
  };

  const roleLabel = userRoleOptions.find((r) => r.value === user?.role)?.label ?? user?.role;
  const roleColor = ROLE_COLOR[user?.role ?? ''] ?? 'var(--text-muted)';
  const avatarLetter = user?.username?.[0] ?? '?';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Профіль</h1>
        <p className={styles.subtitle}>Твої особисті дані</p>
      </header>

      <article className={styles.card}>
        <section className={styles.avatarRow}>
          <span className={styles.avatar} aria-hidden="true">
            {avatarLetter}
          </span>
          <div className={styles.avatarInfo}>
            <h2 className={styles.username}>{user?.username}</h2>
            <span
              className={styles.roleBadge}
              style={{
                color: roleColor,
                background: `${roleColor}18`,
                border: `1px solid ${roleColor}40`,
              }}
            >
              {roleLabel}
            </span>
          </div>
        </section>

        <hr className={styles.divider} />

        <section className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="profile-email">
            Email
          </label>
          <div className={styles.emailRow}>
            <TextField
              id="profile-email"
              size="small"
              placeholder="Введіть email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              disabled={!email || email === user?.email}
              onClick={handleSaveEmail}
              sx={{ minWidth: 0, px: 1.5 }}
            >
              <CheckIcon fontSize="small" />
            </Button>
          </div>
        </section>
      </article>
    </main>
  );
};

export default Profile;
