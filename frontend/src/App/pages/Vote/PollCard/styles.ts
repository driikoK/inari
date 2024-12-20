import styled from 'styled-components';

export const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: white;
  ${({ theme }) =>
    theme.mq({
      width: ['200px ', '225px', '225px', '225px'],
    })};
  background-color: ${({ theme }) => theme.colors.title};
`;

export const PosterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const InfoWrapper = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 100%;
`;

export const LinkParagraph = styled.span`
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.link};
`;

export const CheckboxWrapper = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: white;
  border-radius: 50%;
`;

export const PriorityWrapper = styled.div`
  position: absolute;
  top: 13px;
  right: 5px;
  background-color: ${({ theme }) => theme.colors.yellow};
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-weight: 500;
  color: black;
  padding: 5px;
`;

export const SponsoredWrapper = styled.div`
  position: absolute;
  bottom: 13px;
  right: 5px;
  background-color: ${({ theme }) => theme.colors.yellow};
  font-family: ${({ theme }) => theme.font.family.montserrat};
  font-weight: 500;
  color: black;
  padding: 5px;
`;

export const LinkWrapper = styled.a`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
`;

export const Poster = styled.div<{ $url: string }>`
  background-image: url(${({ $url }) => $url});
  background-size: cover;
  width: 100%;
  ${({ theme }) =>
    theme.mq({
      height: ['300px', '300px', '317px', '317px'],
    })};
  cursor: pointer;
`;
