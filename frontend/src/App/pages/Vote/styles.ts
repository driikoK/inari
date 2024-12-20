import { Button } from '@mui/material';
import styled from 'styled-components';

export const PageWrapper = styled.div`
  ${({ theme }) =>
    theme.mq({
      padding: ['16px', '16px', '20px 80px', '20px 80px'],
    })};
`;

export const CardsWrapper = styled.div`
  display: grid;
  flex-wrap: wrap;
  margin: 20px 0px 20px 0px;
  grid-gap: 25px;
  ${({ theme }) =>
    theme.mq({
      justifyItems: ['center', 'center', 'start', 'start'],
      gap: ['10px', '10px', '25px', '25px'],
      gridTemplateColumns: [
        'repeat(1, minmax(200px, 1fr))',
        'repeat(1, minmax(200px, 1fr))',
        'repeat(auto-fill, minmax(225px, 1fr))',
        'repeat(auto-fill, minmax(225px, 1fr))',
      ],
    })};
`;

export const TitleWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.title};
  padding: 16px;
  width: 100%;
  text-align: center;
  justify-content: center;
`;

export const SubmitButton = styled(Button)`
  position: fixed !important;
  bottom: 20px;
  && {
    ${({ theme }) =>
      theme.mq({
        right: ['16px', '16px', '100px', '100px'],
        fontSize: ['16px', '16px', '20px', '20px'],
      })};
  }
`;
