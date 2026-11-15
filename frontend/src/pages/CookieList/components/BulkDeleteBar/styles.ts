import styled from 'styled-components';

export const Bar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 16px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--font-body);
`;

export const Count = styled.span`
  margin-right: auto;
  font-weight: 600;
`;
