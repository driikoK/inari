import { Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode | string;
}

export default function H5({ children, ...props }: Props & TypographyProps) {
  return (
    <Typography variant="h5" {...props}>
      {children}
    </Typography>
  );
}
