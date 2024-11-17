import { Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode | string;
}

export default function P({ children, ...props }: Props & TypographyProps) {
  return (
    <Typography variant="body1" {...props}>
      {children}
    </Typography>
  );
}
