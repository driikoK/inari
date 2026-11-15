import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 16px;
`;

export const Title = styled.span`
  font-family: var(--font-head);
  color: var(--text);
  font-weight: 700;
  font-size: 22px;
`;
