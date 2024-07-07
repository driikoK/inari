import { Dialog, dialogClasses } from '@mui/material';
import styled from 'styled-components';

export const DialogContainer = styled(Dialog)`
  .${dialogClasses.paper} {
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

export const DialogWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Paragraph = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  text-align: center;
`;

export const Title = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-style: normal;
  font-weight: 600;
  ${({ theme }) =>
    theme.mq({
      fontSize: ['17px', '17px', '17px', '21px'],
  })}
  text-align: center;
`;

export const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
`;

export const ColorText = styled.span`
  color: blue;
`;

export const ErrorText = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-style: normal;
  font-size: 16px;
  color: red;
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
`;