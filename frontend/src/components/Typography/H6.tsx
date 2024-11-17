import { Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode | string;
}

export default function H6({ children, ...props }: Props & TypographyProps) {
  return (
    <Typography variant="h6" {...props}>
      {children}
    </Typography>
  );
}
