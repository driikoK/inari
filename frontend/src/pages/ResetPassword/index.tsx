import { ErrorText, H6 } from '@/components';
import { useAuthStore } from '@/stores';
import { ErrorMessage } from '@hookform/error-message';
import { Box, Button, Card, CardActions, TextField } from '@mui/material';
import { Controller, Form, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

type FormFields = {
  password: string;
  repeatedPassword: string;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      password: '',
      repeatedPassword: '',
    },
  });

  const onSubmitForm = async (form: FormFields) => {
    const { password } = form;

    try {
      await resetPassword(token!, password);

      toast.success('Пароль успішно змінено');
      navigate('/login');
    } catch (error) {}
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
      <Card sx={{ minWidth: '35vw', padding: '50px' }}>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <H6 align="center">Відновити пароль</H6>

            <Controller
              name="password"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  variant="outlined"
                  placeholder="Пароль"
                  label="Пароль"
                  type="password"
                  sx={{ width: '100%' }}
                  {...field}
                />
              )}
            />

            <Controller
              name="repeatedPassword"
              control={control}
              rules={{
                required: true,
                validate: (value) => value === getValues('password') || 'Паролі не співпадають',
              }}
              render={({ field }) => (
                <TextField
                  variant="outlined"
                  placeholder="Повторіть пароль"
                  label="Підтвердження паролю"
                  type="password"
                  sx={{ width: '100%' }}
                  {...field}
                />
              )}
            />

            <ErrorMessage
              errors={errors}
              name="repeatedPassword"
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />

            <CardActions sx={{ flexDirection: 'column', marginTop: '24px', padding: '0' }}>
              <Button
                size="large"
                type="submit"
                sx={{ color: 'black', width: '100%', textTransform: 'none' }}
                variant="contained"
              >
                Відновити
              </Button>
            </CardActions>
          </Box>
        </form>
      </Card>
    </Box>
  );
};

export default ResetPassword;
