import { FunctionComponent } from "react";
import { CardContainer, CheckboxWrapper, Icon, InfoWrapper, LinkParagraph, LinkWrapper, Paragraph, Poster, PriorityWrapper } from "./styles";
import { Checkbox } from "@mui/material";

export interface ICardProps {
  name: string;
  link: string;
  posterUrl: string;
  checked: boolean;
  isPriority: boolean;
  onCheckboxChange: () => void;
}

const Card: FunctionComponent<ICardProps> = ({ name, link, posterUrl, checked, isPriority, onCheckboxChange }) => {
  return (
    <CardContainer>
      <CheckboxWrapper>
        <Checkbox
          checked={checked}
          onChange={onCheckboxChange}
        />
      </CheckboxWrapper>
      <PriorityWrapper>
        {isPriority ? '+25% крихт' : null}
      </PriorityWrapper>
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
