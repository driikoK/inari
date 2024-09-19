import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(1turn);
  }
`;

const rotateOpacity = keyframes`
  0% {
    transform: rotate(0deg);
    opacity: 0.1;
  }
  100% {
    transform: rotate(1turn);
    opacity: 1;
  }
`;

const fallbackLoaderPulse = keyframes`
  0% {
    transform: scale(0.95);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(0.95);
  }
`;

export const FallbackSpinner = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.app-loader {
    height: 100vh;
    flex-direction: column;

    .loading {
      margin-top: 1rem;
    }
  }

  .loading {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    border: 3px solid transparent;
    box-sizing: border-box;
    position: relative;

    .effect-1,
    .effect-2,
    .effect-3 {
      width: 55px;
      height: 55px;
      border-radius: 50%;
      border: 3px solid transparent;
      border-left: 3px solid rgba(121, 97, 249, 1);
      box-sizing: border-box;
    }

    .effect-1 {
      position: absolute;
      animation: ${rotate} 1s ease infinite;
    }

    .effect-2 {
      position: absolute;
      animation: ${rotateOpacity} 1s ease infinite 0.1s;
    }

    .effect-3 {
      animation: ${rotateOpacity} 1s ease infinite 0.2s;
    }

    .effects {
      transition: all 0.3s ease;
    }
  }
`;

export const Blob = styled.div`
  transform: scale(1);
  animation: ${fallbackLoaderPulse} 2s infinite;
`;
