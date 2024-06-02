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