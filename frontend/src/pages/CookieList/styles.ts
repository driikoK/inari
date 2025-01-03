import styled from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${({ theme }) =>
    theme.mq({
      padding: ['16px', '16px', '20px 80px', '20px 80px'],
    })};
`;

export const Title = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  color: white;
  font-weight: 600;
  font-size: 18px;
`;

export const TitleWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.title};
  padding: 16px;
  width: 100%;
  text-align: center;
  justify-content: center;
  margin-bottom: 10px;
`;
