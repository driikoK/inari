import { Dialog, dialogClasses } from '@mui/material';
import styled from 'styled-components';

export const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
`;

export const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

export const DialogContainer = styled(Dialog)`
  .${dialogClasses.paper} {
    ${({ theme }) =>
      theme.mq({
        padding: ['16px', '16px', '16px', '30px'],
        paddingTop: ['40px', '40px', '40px', '50px'],
      })}
    ${({ theme }) =>
      theme.mq({
        gap: ['16px', '16px', '16px', '28px'],
      })}
    border-radius: 12px;
  }
`;
