import { Button as MuiButton } from '@mui/material';
import styled, { css } from 'styled-components';

export interface IButtonProps {
  $minWidth?: number | string;
  $maxWidth?: number | string;
  $width?: number | string;
  $color?: string;
  $backgroundColor?: string;
}

const Button = styled(MuiButton).attrs({
  disableElevation: true,
})<IButtonProps>`
  && {
    text-transform: none;
    ${({ theme }) =>
    theme.mq({
      fontSize: ["16px", "16px", "20px", "20px"],
    })};
    font-weight: 600;
    color: ${({ $color }) => $color || '#161d16'};
    height: 44px;
    min-height: fit-content;
    border-radius: 8px;

    ${({ $backgroundColor }) =>
      $backgroundColor
        ? css`
            background-color: ${$backgroundColor};
          `
        : null}
  }
`;

export default Button;
