import { FunctionComponent, useState } from 'react';
import {
  Container,
  FlexWrapper,
  InfoWrapper,
  Paragraph,
  ParagraphBold,
  RoleWrapper,
} from './styles';
import { Dialog, DialogActions, DialogTitle, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '../Button';

interface IListCardProps {
  id: string,
  typeRole: string;
  note: string | null;
  currentEpisode: number;
  nickname: string;
  coins: number;
  titleName: string;
  onDelete: (id: string) => Promise<void>;
}

const handleColor = (typeRole: string) => {
  if (typeRole === 'director') {
    return '#55e88b';
  } else if (typeRole === 'dub') {
    return '#c500ed';
  } else if (typeRole === 'sound') {
    return '#4b2fff';
  } else if (typeRole === 'sub') {
    return '#fef02a';
  } else {
    return 'white';
  }
};

const ListCard: FunctionComponent<IListCardProps> = ({
  id,
  typeRole,
  nickname,
  coins,
  note,
  currentEpisode,
  titleName,
  onDelete
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Container>
      <InfoWrapper>
      <Paragraph>Нікнейм: <ParagraphBold>{nickname}</ParagraphBold></Paragraph>
      <FlexWrapper>
        <Paragraph>
          Роль:{' '}
          
        </Paragraph>
        <RoleWrapper $color={handleColor(typeRole)}>{typeRole} </RoleWrapper>
      </FlexWrapper>
      <Paragraph>Крихти: <ParagraphBold>{coins}</ParagraphBold></Paragraph>
      <Paragraph>Епізод: <ParagraphBold>{currentEpisode}</ParagraphBold></Paragraph>
      <Paragraph>Аніме: <ParagraphBold>{titleName}</ParagraphBold></Paragraph>
      <Paragraph>Нотатка: <ParagraphBold>{note ? note : 'порожня'}</ParagraphBold></Paragraph>
      </InfoWrapper>
      <IconButton onClick={() => setOpen(true)}><DeleteIcon color="warning" fontSize="large" /></IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>
          {"Ви впевнені, що бажаєте видалити?"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Ні</Button>
          <Button onClick={() => { onDelete(id); setOpen(false)}} autoFocus>
            Так
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListCard;
