import { memo } from 'react';

type IconProps = {
  img: string;
  width?: number;
  height?: number;
};

export const Icon = memo(({ img, width = 25, height = 25 }: IconProps) => (
  <img alt="icon" src={img} width={width} height={height} />
));
