import { Select, selectClasses } from "@mui/material";
import styled from "styled-components";

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${({ theme }) =>
    theme.mq({
      padding: ["16px", "16px", "20px 80px", "20px 80px"],
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

export const ListWrapper = styled.div`
  display: grid;
  flex-wrap: wrap;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  justify-items: center;
  gap: 16px 12px;
`;

export const SelectWrapper = styled.div`
  display: flex;
`;

export const StyledSelect = styled(Select)`
.${selectClasses.select}{
    background-color: white;
  }
`;

export const ClearOptionItem = styled.span`
  font-weight: 500;
`;