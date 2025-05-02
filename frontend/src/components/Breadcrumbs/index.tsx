import { Box, Breadcrumbs } from '@mui/material';
import { FC, PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { isObjEmpty } from '@/utils/objects';

type Link = {
  link: string;
  title: string;
  icon?: JSX.Element;
  onClick?: () => void;
} | null;

type Props = {
  links: Link[];
} & PropsWithChildren;

export const CustomBreadcrumbs: FC<Props> = ({ links, children }) => {
  return (
    <Breadcrumbs aria-label="breadcrumb" color="white">
      {links.map((item) => {
        if (!item) return null;

        return (
          <Link to={item.link} onClick={item.onClick} key={item.link} style={{ color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.title} {item.icon}
            </Box>
          </Link>
        );
      })}

      {children}
    </Breadcrumbs>
  );
};
