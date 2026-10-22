import { z } from 'zod';

export const LINK_MESSAGE = 'Введіть коректне посилання';

export const httpUrl = z.url({ protocol: /^https?$/, error: LINK_MESSAGE });
