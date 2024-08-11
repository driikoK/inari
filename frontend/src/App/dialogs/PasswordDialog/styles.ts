import { Button, Dialog, dialogClasses } from '@mui/material';
import styled from 'styled-components';

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

export const Paragraph = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-style: normal;
  font-weight: 500;
  ${({ theme }) =>
    theme.mq({
      fontSize: ['19px', '19px', '19px', '25px'],
      lineHeight: ['21px', '21px', '21px', '22px'],
  })}
  text-align: center;
`;

export const ErrorText = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-style: normal;
  font-size: 16px;
  text-align: center;
  color: red;
`;

export const SubmitButton = styled(Button)`
  &&{
    font-family: ${({ theme }) => theme.font.family.montserrat};
    ${({ theme }) =>
    theme.mq({
      fontSize: ['16px', '16px', '16px', '20px'],
    })};
    font-weight: 500;
  }
`;