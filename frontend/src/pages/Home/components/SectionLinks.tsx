import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { OpenInNewOutlined } from '@mui/icons-material';
import { useNavItems } from '@/components/Sidebar/useNavItems';
import styles from '../Home.module.scss';

export const SectionLinks: FunctionComponent = () => {
  const navigate = useNavigate();
  const items = useNavItems().filter(({ id }) => id !== 'home');

  return (
    <div className={`fade-up ${styles.links}`}>
      {items.map((item) =>
        item.href ? (
          <Button
            key={item.id}
            variant="outlined"
            component="a"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={item.icon}
            endIcon={<OpenInNewOutlined sx={{ fontSize: 16 }} />}
          >
            {item.label}
          </Button>
        ) : (
          <Button
            key={item.id}
            variant="outlined"
            startIcon={item.icon}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </Button>
        ),
      )}
    </div>
  );
};
