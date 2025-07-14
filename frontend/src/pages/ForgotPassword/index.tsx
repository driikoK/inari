import { H6 } from '@/components';
import { useAuthStore } from '@/stores';
import { Box, Button, Card, CardActions, TextField } from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const [email, setEmail] = useState('');

  const handleResetClick = async () => {
    try {
      await forgotPassword(email);
      toast.success('Лист відправлено!');
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
      <Card sx={{ minWidth: '35vw', padding: '50px', display: 'flex', flexDirection: 'column' }}>
        <H6 align="center" mb={2}>
          Відновити пароль
        </H6>

        <TextField
          variant="outlined"
          placeholder="Email"
          label="Email"
          type="text"
          sx={{ width: '100%' }}
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <CardActions sx={{ flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <Button
            variant="text"
            size="small"
            sx={{ cursor: 'pointer', color: 'black', textTransform: 'none' }}
            onClick={() => navigate('/login')}
          >
            Повернутися до входу
          </Button>

          <Button
            size="large"
            sx={{ color: 'black', width: '100%', textTransform: 'none' }}
            variant="contained"
            onClick={handleResetClick}
          >
            Відновити
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
