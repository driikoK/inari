import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 16px;
`;

export const Title = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  color: white;
  font-weight: 600;
  font-size: 18px;
`;