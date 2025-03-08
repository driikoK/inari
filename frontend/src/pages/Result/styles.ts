import styled from 'styled-components';

export const PageWrapper = styled.div`
  ${({ theme }) =>
    theme.mq({
      padding: ['16px', '16px', '20px 80px', '20px 80px'],
    })};
`;

export const ListsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px 0px 20px 0px;
  gap: 20px;
`;

export const TitleWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.title};
  padding: 16px;
  width: 100%;
  text-align: center;
  justify-content: center;
`;
