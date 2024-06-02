import { Button } from "@mui/material";
import styled from "styled-components";

export const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  position: relative;
`;

export const PageWrapper = styled.div`
  ${({ theme }) =>
    theme.mq({
      padding: ["16px", "16px", "20px 80px", "20px 80px"],
  })};
`;

export const CardsWrapper = styled.div`
  display: grid;
  flex-wrap: wrap;
  margin: 20px 0px 20px 0px;
  ${({ theme }) =>
    theme.mq({
      gridTemplateColumns: [
        "repeat(auto-fill, minmax(150px, 1fr))", 
        "repeat(auto-fill, minmax(150px, 1fr))", 
        "repeat(auto-fill, minmax(225px, 1fr))", 
        "repeat(auto-fill, minmax(225px, 1fr))"],
  })};
  justify-items: center;
  ${({ theme }) =>
    theme.mq({
      gap: ["16px 6px", "16px 6px", "16px 12px", "16px 12px"],
  })};
`;

export const Title = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  color: white;
  font-weight: 500;
  font-size: 16px;
`;

export const TitleWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.title};
  padding: 16px;
  width: 100%;
  text-align: center;
  justify-content: center;
`;

export const ButtonWrapper = styled.div`
  position: fixed !important;
  bottom: 20px;
  ${({ theme }) =>
    theme.mq({
      right: ["16px", "16px", "100px", "100px"],
  })};
`;

export const SubmitButton = styled(Button)`
  &&{
    ${({ theme }) =>
    theme.mq({
      fontSize: ["16px", "16px", "20px", "20px"],
    })};
    font-weight: 600;
  }
`;