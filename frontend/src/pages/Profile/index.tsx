import { H6, P } from '@/components';
import { useAuthStore } from '@/stores';
import { Box, Button, Input } from '@mui/material';
import { TitleWrapper } from '../CookieList/styles';
import { PageWrapper } from '../Result/styles';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { userRoleOptions } from '@/utils/constants';
import CheckIcon from '@mui/icons-material/Check';

const Profile = () => {
  const { user, updateUser } = useAuthStore();

  const [email, setEmail] = useState<string>(user?.email || '');

  const handleOnClick = async () => {
    try {
      await updateUser(user!._id, user!.role, email);
      toast.success('Успішно оновлено');
    } catch (error) {}
  };

  const userRole = userRoleOptions.find((role) => role.value === user?.role)?.label;
  const userInfo = [
    { label: 'Юзернейм', value: user?.username },
    { label: 'Роль', value: userRole },
  ];

  return (
    <PageWrapper>
      <TitleWrapper>
        <H6 sx={(theme) => ({ color: theme.palette.secondary.main })}>Профіль</H6>
      </TitleWrapper>

      <Box
        sx={{
          backgroundColor: 'white',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <div>
          {userInfo.map((info) => (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <P>{info.label}: </P> <P>{info.value}</P>
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <P>Email: </P>
            <Box sx={{ display: 'flex' }}>
              <Input
                placeholder="Введіть email"
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button disabled={!email} onClick={handleOnClick}>
                <CheckIcon sx={(theme) => ({ color: theme.palette.secondary.contrastText })} />
              </Button>
            </Box>
          </Box>
        </div>
      </Box>
    </PageWrapper>
  );
};

export default Profile;
