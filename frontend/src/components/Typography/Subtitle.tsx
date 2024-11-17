import { Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode | string;
}

export default function Subtitle({ children, ...props }: Props & TypographyProps) {
  return (
    <Typography variant="subtitle1" {...props}>
      {children}
    </Typography>
  );
}
