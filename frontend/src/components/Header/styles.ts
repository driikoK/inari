import styled from "styled-components";
import Button from "../Button";

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.title};
  ${({ theme }) =>
    theme.mq({
      padding: ["16px", "16px", "16px 80px", "16px 80px"],
  })};
  align-items: center;
  justify-content: space-between;
`;

export const LogoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
  cursor: pointer;
`;

export const NavWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
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
`;

export const NavButton = styled(Button)`
  &&{ 
    color: white;
    font-size: 16px;

    &::before{
      content: "▾";
      margin-right: 5px;
    }
  }
`;