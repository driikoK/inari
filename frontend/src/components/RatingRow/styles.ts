import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.gray};
  width: 100%;
  min-height: 50px;

  font-family: ${({ theme }) => theme.font.family.montserrat};
  color: white;
  font-weight: 500;
  font-size: 16px;
`;

export const NumberWrapper = styled.div<{ $color?: string }>`
  display: flex;
  min-width: 50px;
  background-color: ${ ({$color}) => $color? $color : 'blue' };
  color: black;
  font-weight: 800;
  font-size: 20px;
  text-align: center;
  align-items: center;
  justify-content: center;
`;

export const NicknameWrapper = styled.div`
  display: flex;
  width: 100%;
  text-align: center;
  align-items: center;
  justify-content: start;
  padding-left: 16px;
`;

export const CoinsWrapper = styled.div`
  display: flex;
  min-width: 100px;
  background-color: red;
  text-align: center;
  align-items: center;
  justify-content: center;
`;