import { Select, selectClasses } from "@mui/material";
import styled from "styled-components";

export const StyledSelect = styled(Select)`
.${selectClasses.select}{
    background-color: white;
  }
`;

export const ClearOptionItem = styled.span`
  font-weight: 500;
`;