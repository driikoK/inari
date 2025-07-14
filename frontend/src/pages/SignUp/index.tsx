import { ErrorText, H6 } from '@/components';
import { useAuthStore } from '@/stores';
import theme from '@/theme/theme';
import { ErrorMessage } from '@hookform/error-message';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import LoginIcon from '@mui/icons-material/Login';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type SignUpFormValue = {
  nickname: string;
  password: string;
  repeatedPassword: string;
  email: string;
};

type fieldType = {
  name: keyof SignUpFormValue;
  label: string;
  rules: any;
};

const SignUp = () => {
  const isTablet = useMediaQuery(theme.screens.tablet);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<SignUpFormValue>({
    defaultValues: { nickname: '', password: '', email: '', repeatedPassword: '' },
    criteriaMode: 'all',
    mode: 'onChange',
  });

  const onSubmitForm = async (form: SignUpFormValue) => {
    const { nickname, password, email } = form;

    try {
      await signUp(nickname, password, email);
      toast.success('Реєстрація пройшла успішно!');
      navigate('/login');
    } catch (e) {}
  };

  const formFields: fieldType[] = [
    {
      name: 'nickname',
      label: 'Нікнейм',
      rules: {
        required: 'Поле обов’язкове',
        minLength: { value: 3, message: 'Мінімум 3 символи' },
      },
    },
    {
      name: 'password',
      label: 'Пароль',
      rules: {
        required: 'Поле обов’язкове',
        minLength: { value: 3, message: 'Мінімум 3 символи' },
      },
    },
    {
      name: 'repeatedPassword',
      label: 'Повторіть пароль',
      rules: {
        required: 'Поле обов’язкове',
        validate: (value: string) => value === getValues('password') || 'Паролі не співпадають',
      },
    },
    {
      name: 'email',
      label: 'Пошта',
      rules: {
        required: 'Поле обов’язкове',
      },
    },
  ];

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
            <H6>Зареєструватися</H6>

            {formFields.map(({ name, label, rules }) => {
              return (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'start' }}
                  key={name}
                >
                  <Controller
                    control={control}
                    name={name}
                    rules={rules}
                    render={({ field }) => (
                      <TextField
                        variant="outlined"
                        placeholder={label}
                        label={label}
                        type="text"
                        sx={{ width: '100%' }}
                        {...field}
                      />
                    )}
                  />

                  <ErrorMessage
                    errors={errors}
                    name={name}
                    render={({ message }) => <ErrorText>{message}</ErrorText>}
                  />
                </Box>
              );
            })}
          </CardContent>

          <CardActions sx={{ flexDirection: 'column', gap: 1, marginTop: '24px' }}>
            <Button
              variant="text"
              size="small"
              sx={{ cursor: 'pointer', color: 'black', textTransform: 'none' }}
              onClick={() => navigate('/login')}
            >
              Увійти <LoginIcon sx={{ ml: 1 }} />
            </Button>

            <Button
              size="large"
              type="submit"
              sx={{ color: 'black', width: '100%', textTransform: 'none' }}
              variant="contained"
            >
              <>
                Зареєструватися
                <FileDownloadDoneIcon sx={{ ml: 1 }} />
              </>
            </Button>
          </CardActions>
        </form>
      </Card>
    </Box>
  );
};

export default SignUp;
