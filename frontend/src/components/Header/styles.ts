import styled from "styled-components";

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.title};
  ${({ theme }) =>
    theme.mq({
      padding: ["16px", "16px", "16px 80px", "16px 80px"],
  })};
  align-items: center;
  gap: 16px;
  cursor: pointer;
`;

export const Paragraph = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  color: white;
  font-weight: bold;
  font-size: 20px;
`;

export const Logo = styled.div`
  display: block;
  background-image: url(/logo.jpg);
  background-size: contain;
  height: 50px;
  width: 50px;
`