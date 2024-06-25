import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background-color: ${({ theme }) => theme.colors.gray};
  width: 200px;
  border-radius: 18px;
  padding: 16px;
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  font-family: ${({ theme }) => theme.font.family.montserrat};
  color: white;
  font-weight: 500;
  font-size: 16px;
`;

export const RoleWrapper = styled.div<{ $color?: string }>`
  display: flex;
  background-color: ${ ({$color}) => $color? $color : 'blue' };
  color: black;
  padding: 3px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  align-items: center;
  justify-content: center;
`;

export const Paragraph = styled.span`
  color: #bde6ff;
  font-size: 16px;
`;

export const ParagraphBold = styled.span`
  color: white;
  font-size: 16px;
  font-weight: 550;
`;

export const FlexWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
`;