import styled from 'styled-components';

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: white;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.title};
  padding: 20px;
  gap: 15px;
`;

export const Priority = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-size: 15px;
  color: blue;
`;

export const VotesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-left: 10px;
  padding: 5px;
  background-color: #4f4f44;
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
`;
