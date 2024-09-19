import { FallbackSpinner, Blob } from './styles';
import { Logo } from '../Header/styles';

const FallbackComponent = () => {
  return (
    <FallbackSpinner className="app-loader">
      <Blob>
        <Logo />
      </Blob>
    </FallbackSpinner>
  );
};

export default FallbackComponent;
