import { FC, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ErrorMessage } from '@hookform/error-message';

import LoginIcon from '@mui/icons-material/Login';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  useMediaQuery,
} from '@mui/material';

import theme from '@theme';
import { useAuthStore } from '@/stores';
import { H6, ErrorText } from '@/components';

type FormValues = {
  nickname: string;
  password: string;
};

const Login: FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const isTablet = useMediaQuery(theme.screens.tablet);
  const { signUp, login } = useAuthStore();
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
      if (isSignUp) {
        await signUp(nickname, password);
        setIsSignUp(false);
        toast.success('Реєстрація пройшла успішно!');
      } else {
        await login(nickname, password);
        navigate('/cookie');
      }
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
            <H6>{isSignUp ? 'Зареєструватися' : 'Увійти'}</H6>

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
            </Box>
          </CardContent>

          <CardActions sx={{ flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <Button
              variant="text"
              size="small"
              sx={{ cursor: 'pointer', color: 'black', textTransform: 'none' }}
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? (
                <>
                  Увійти <LoginIcon sx={{ ml: 1 }} />
                </>
              ) : (
                'Немає акаунту?'
              )}
            </Button>

            <Button
              size="large"
              type="submit"
              sx={{ color: 'black', width: '100%', textTransform: 'none' }}
              variant="contained"
            >
              {isSignUp ? (
                <>
                  Зареєструватися
                  <FileDownloadDoneIcon sx={{ ml: 1 }} />
                </>
              ) : (
                <>
                  Увійти <LoginIcon sx={{ ml: 1 }} />
                </>
              )}
            </Button>
          </CardActions>
        </form>
      </Card>
    </Box>
  );
};

export default Login;
