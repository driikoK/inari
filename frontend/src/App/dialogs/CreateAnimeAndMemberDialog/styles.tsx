import styled from 'styled-components';

export const DialogWrapper = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  ${({ theme }) =>
    theme.mq({
      fontSize: ['17px', '17px', '17px', '21px'],
    })}
  text-align: center;
`;
