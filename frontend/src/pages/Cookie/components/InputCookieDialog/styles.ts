import { Dialog, dialogClasses } from '@mui/material';
import styled from 'styled-components';

export const DialogContainer = styled(Dialog)`
  .${dialogClasses.paper} {
    ${({ theme }) =>
      theme.mq({
        padding: ['16px', '16px', '16px', '30px'],
      })}
    ${({ theme }) =>
      theme.mq({
        gap: ['16px', '16px', '16px', '28px'],
      })}
    border-radius: 12px;
  }
`;

export const DialogWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;

  > h6 {
    text-align: center;
  }
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
`;

export const FieldContainer = styled.div`
  display: flex;
  ${({ theme }) =>
    theme.mq({
      flexDirection: ['column', 'column', 'row', 'row'],
      alignItems: ['flex-start', 'flex-start', 'center', 'center'],
    })};
  gap: 16px;
  align-items: center;
  margin: 10px 0;
`;

export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
`;
