import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  ${({ theme }) =>
    theme.mq({
      flexDirection: ['column', 'column', 'row', 'row'],
    })};
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 30px;
  flex-wrap: wrap;
`;

export const ElementImage = styled.div<{ $url: string }>`
  background-image: url(${({ $url }) => $url});
  background-size: cover;
  height: 200px;
  width: 100%;
  border-radius: 18px;
  aspect-ratio: 1;
`;

export const ElementContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 250px;
  border-radius: 18px;
  padding: 16px;
  gap: 8px;
  align-items: center;
  cursor: pointer;
`;
