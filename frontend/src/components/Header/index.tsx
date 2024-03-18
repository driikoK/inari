import { FunctionComponent } from 'react';
import { HeaderContainer, Logo, Paragraph } from './styles';
import { useNavigate } from 'react-router-dom';

const Header: FunctionComponent = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/home');
  };

  return (
    <HeaderContainer onClick={handleClick}>
      <Logo />
      <Paragraph>Inari</Paragraph>
    </HeaderContainer>
  );
};

export default Header;
