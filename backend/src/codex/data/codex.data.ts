import { z } from 'zod';

export const MAX_CODEX_BLOCKS = 2000;
export const MAX_CODEX_SIZE = 200_000;

const HREF_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// A space is refused too, the editor of the page refuses it as well: the browser's `URL` would take
// «https://a b» where this one does not
const isSafeHref = (href: string) => {
  if (/\s/.test(href)) return false;

  try {
    return HREF_PROTOCOLS.includes(new URL(href).protocol);
  } catch {
    return false;
  }
};

const bold = z.object({ type: z.literal('bold') });
const italic = z.object({ type: z.literal('italic') });

const link = z.object({
  type: z.literal('link'),
  attrs: z
    .object({
      href: z
        .string()
        .max(2048, 'Посилання задовге')
        .refine(
          isSafeHref,
          'Посилання має починатися з http://, https:// або mailto:',
        ),
    })
    .transform(({ href }) => ({
      href,
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
      class: null,
    })),
});

const marks = z
  .array(z.discriminatedUnion('type', [bold, italic, link]))
  .max(5);

const text = z.object({
  type: z.literal('text'),
  text: z.string().min(1).max(20_000),
  marks: marks.optional(),
});
const hardBreak = z.object({ type: z.literal('hardBreak') });
const inline = z
  .array(z.discriminatedUnion('type', [text, hardBreak]))
  .max(2000)
  .optional();

const paragraph = z.object({ type: z.literal('paragraph'), content: inline });
const heading = z.object({
  type: z.literal('heading'),
  attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }),
  content: inline,
});
const horizontalRule = z.object({ type: z.literal('horizontalRule') });

export const CodexContent = z
  .object({
    type: z.literal('doc'),
    content: z
      .array(z.discriminatedUnion('type', [paragraph, heading, horizontalRule]))
      .min(1, 'Текст не може бути порожнім')
      .max(MAX_CODEX_BLOCKS, 'Забагато блоків'),
  })
  .refine((doc) => JSON.stringify(doc).length <= MAX_CODEX_SIZE, {
    error: 'Текст завеликий',
  });

export const SaveCodexData = z.object({ content: CodexContent });

export type CodexContent = z.infer<typeof CodexContent>;
export type SaveCodexData = z.infer<typeof SaveCodexData>;
