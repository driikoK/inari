import { FunctionComponent } from 'react';
import { CoinsWrapper, Container, NicknameWrapper, NumberWrapper } from './styles';

interface IRatingRowProps {
  number: number
  nickname: string,
  coins: number,
}

const handleColor = (number: number) => {
  if (number === 1) {
    return '#55e88b';
  }
  if (number === 2) {
    return '#87ebaa';
  }
  if (number === 3) {
    return '#a9e3bd';
  }
  if (number > 3) {
    return 'white';
  }
}

const RatingRow: FunctionComponent<IRatingRowProps> = ({ number, nickname, coins }) => {
  return (
    <Container>
      <NumberWrapper $color={handleColor(number)}>{number}</NumberWrapper>
      <NicknameWrapper>{nickname}</NicknameWrapper>
      <CoinsWrapper>{coins}{coins >= 5 || coins === 0 ? ' крихт' : coins >= 2 ? ' крихти' : ' крихта'}</CoinsWrapper>
    </Container>
  );
};

export default RatingRow;
