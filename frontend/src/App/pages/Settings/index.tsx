import { useEffect } from 'react';
import toast from 'react-hot-toast';

import { GridColDef, GridRowModel } from '@mui/x-data-grid';

import { PageContainer, Title, TitleWrapper } from '../CookieList/styles';
import { CustomTable } from '@/components/CustomTable';
import useAuthStore, { User } from '@/stores/useAuthStore';
import { ROLE } from '@/context/casl';

export const userRoleOptions = [
  {
    label: 'Адмін',
    value: ROLE.ADMIN,
  },
  {
    label: 'Куратор',
    value: ROLE.DIRECTOR,
  },
  {
    label: 'Учасник',
    value: ROLE.MEMBER,
  },
];

const Settings = () => {
  const { getAllUsers, allUsers, updateUser, user } = useAuthStore();

  useEffect(() => {
    getAllUsers();
  }, []);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'username',
      headerName: 'Нікнейм',
      width: 300,
    },
    {
      field: 'role',
      headerName: 'Роль',
      width: 400,
      type: 'singleSelect',
      valueOptions: userRoleOptions,
      editable: true,
    },
  ];

  const rows: User[] = allUsers
    .filter((user) => user.username !== 'root')
    .map((user) => {
      return {
        ...user,
        id: user._id,
      };
    });

  const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    if (newRow.role === oldRow.role) return oldRow;
    if (newRow.username === user!.username) {
      toast.error('Ви не можете змінювати собі роль');
      return oldRow;
    }

    try {
      await updateUser(newRow.username, newRow.role);
      toast.success('Успішно оновлено');

      return newRow;
    } catch (error) {
      toast.error('Сталася помилка');
      return oldRow;
    }
  };

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Налаштування юзерів</Title>
      </TitleWrapper>

      <CustomTable rows={rows} columns={columns} processRowUpdate={processRowUpdate} />
    </PageContainer>
  );
};

export default Settings;
