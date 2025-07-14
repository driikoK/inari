import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ErrorMessage } from '@hookform/error-message';

import LoginIcon from '@mui/icons-material/Login';

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  TextField,
  useMediaQuery,
} from '@mui/material';

import theme from '@/theme/theme';
import { useAuthStore } from '@/stores';
import { H6, ErrorText } from '@/components';

type FormValues = {
  nickname: string;
  password: string;
};

const Login: FC = () => {
  const isTablet = useMediaQuery(theme.screens.tablet);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { nickname: '', password: '' },
    criteriaMode: 'all',
    mode: 'onChange',
  });

  const onSubmitForm = async (form: FormValues) => {
    const { nickname, password } = form;

    try {
      await login(nickname, password);
      navigate('/cookie');
    } catch (e) {}
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 82px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card sx={{ minWidth: isTablet ? '35vw' : '70vw', padding: isTablet ? '50px' : '20px' }}>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <CardContent
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <H6>Увійти</H6>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'start' }}>
              <Controller
                control={control}
                name="nickname"
                rules={{
                  required: 'Поле обов’язкове',
                  minLength: { value: 3, message: 'Мінімум 3 символи' },
                }}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    placeholder="Нікнейм"
                    label="Нікнейм"
                    type="text"
                    sx={{ width: '100%' }}
                    {...field}
                  />
                )}
              />

              <ErrorMessage
                errors={errors}
                name="nickname"
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'start' }}>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Поле обов’язкове',
                  minLength: { value: 3, message: 'Мінімум 3 символи' },
                }}
                render={({ field }) => (
                  <TextField
                    variant="outlined"
                    type="password"
                    placeholder="Пароль"
                    label="Пароль"
                    sx={{ width: '100%' }}
                    {...field}
                  />
                )}
              />

              <ErrorMessage
                errors={errors}
                name="password"
                render={({ message }) => <ErrorText>{message}</ErrorText>}
              />

              <Link
                href="/forgot-password"
                underline="hover"
                sx={(theme) => ({
                  color: theme.palette.secondary.contrastText,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: '14px',
                  marginLeft: 'auto',
                })}
              >
                Забули пароль?
              </Link>
            </Box>
          </CardContent>

          <CardActions sx={{ flexDirection: 'column', gap: 1, marginTop: '24px' }}>
            <Button
              variant="text"
              size="small"
              sx={{ cursor: 'pointer', color: 'black', textTransform: 'none' }}
              onClick={() => navigate('/sign-up')}
            >
              Немає акаунту?
            </Button>

            <Button
              size="large"
              type="submit"
              sx={{ color: 'black', width: '100%', textTransform: 'none' }}
              variant="contained"
            >
              Увійти <LoginIcon sx={{ ml: 1 }} />
            </Button>
          </CardActions>
        </form>
      </Card>
    </Box>
  );
};

export default Login;
