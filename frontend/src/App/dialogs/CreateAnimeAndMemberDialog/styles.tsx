import { Dialog, dialogClasses } from '@mui/material';
import styled from 'styled-components';

export const DialogWrapper = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
`;

export const DialogContainer = styled(Dialog)`
  .${dialogClasses.paper} {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    ${({ theme }) =>
      theme.mq({
        padding: ['16px', '16px', '16px', '48px'],
      })}
    ${({ theme }) =>
      theme.mq({
        gap: ['16px', '16px', '16px', '28px'],
      })}
    border-radius: 12px;
  }
`;
