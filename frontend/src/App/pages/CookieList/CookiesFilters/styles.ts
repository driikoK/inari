import styled from 'styled-components';

export const SelectWrapper = styled.div`
  display: flex;

  & > *:first-child {
    margin-left: 0;
  }

  & > *:last-child {
    margin-right: 0;
  }
`;
