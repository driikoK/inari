import { Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode | string;
}

export default function ErrorText({ children, ...props }: Props & TypographyProps) {
  return (
    <Typography
      variant="body1"
      sx={(theme) => ({ color: theme.palette.error.main, marginBottom: '0.3rem' })}
      {...props}
    >
      {children}
    </Typography>
  );
}
