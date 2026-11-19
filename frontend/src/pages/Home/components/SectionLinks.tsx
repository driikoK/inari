import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useNavItems } from '@/components/Sidebar/useNavItems';
import styles from '../Home.module.scss';

const NOT_ON_HOME = ['home', 'settings'];

export const SectionLinks: FunctionComponent = () => {
  const navigate = useNavigate();
  const items = useNavItems().filter(({ id }) => !NOT_ON_HOME.includes(id));

  return (
    <div className={`fade-up ${styles.links}`}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant="outlined"
          startIcon={item.icon}
          onClick={() => navigate(item.path)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
};
