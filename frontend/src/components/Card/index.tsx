import { FunctionComponent } from "react";
import { CardContainer, CheckboxWrapper, Icon, InfoWrapper, LinkParagraph, LinkWrapper, Paragraph, Poster } from "./styles";
import { Checkbox } from "@mui/material";

export interface ICardProps {
  name: string;
  link: string;
  posterUrl: string;
  checked: boolean;
  onCheckboxChange: () => void;
}

const Card: FunctionComponent<ICardProps> = ({ name, link, posterUrl, checked, onCheckboxChange }) => {
  return (
    <CardContainer>
      <CheckboxWrapper>
        <Checkbox
          checked={checked}
          onChange={onCheckboxChange}
        />
      </CheckboxWrapper>
      <Poster $url={posterUrl} onClick={onCheckboxChange}/>
      <InfoWrapper>
      <LinkWrapper href={link} target="_blank">
        <Icon/>
        <LinkParagraph>MAL</LinkParagraph>
      </LinkWrapper>
      <Paragraph>{name}</Paragraph>
      </InfoWrapper>
    </CardContainer>
  );
};

export default Card;
