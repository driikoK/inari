import styled from 'styled-components';

export const FieldContainer = styled.div`
  display: flex;
  ${({ theme }) =>
    theme.mq({
      flexDirection: ["column", "column", "row", "row"],
  })};
  gap: 16px;
  align-items: center;
`;

export const Label = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-style: normal;
  font-size: 16px;
  text-align: center;
`;
