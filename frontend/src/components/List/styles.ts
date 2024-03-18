import styled from "styled-components";

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: white;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.title};
  padding: 20px;
  gap: 15px;
`;

export const Paragraph = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-size: 15px;
  color: white;
`;

export const Ongoing = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-size: 15px;
  color: green;
`;

export const Old = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-size: 15px;
  color: red;
`;

export const VotesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-left: 10px;
  padding: 5px;
  background-color: #4f4f44;
`;

export const LinkWrapper = styled.a`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
`;

export const Icon = styled.div`
  background-image: url(/mal.png);
  background-size: contain;
  width: 25px;
  height: 25px;
`;

export const LinkParagraph = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.link};
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
`;