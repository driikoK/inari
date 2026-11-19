import { DEFAULT_CODEX } from '../codex.default.js';
import { CodexContent, MAX_CODEX_BLOCKS, SaveCodexData } from './codex.data.js';

const text = (value: string, marks?: unknown[]) => ({
  type: 'text',
  text: value,
  ...(marks && { marks }),
});
const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content });
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const link = (href: string) => ({ type: 'link', attrs: { href } });

const accepts = (value: unknown) => CodexContent.safeParse(value).success;
const messagesOf = (value: unknown) => {
  const result = CodexContent.safeParse(value);

  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('CodexContent', () => {
  it('takes what the editor offers: paragraphs, headings of two levels, rules, bold, italic, links and line breaks', () => {
    expect(
      accepts(
        doc(
          { type: 'heading', attrs: { level: 2 }, content: [text('1. Вступ')] },
          { type: 'heading', attrs: { level: 3 }, content: [text('1.1')] },
          paragraph(
            text('1.1', [{ type: 'bold' }]),
            text(' Цей '),
            text('Кодекс', [{ type: 'italic' }, { type: 'bold' }]),
            { type: 'hardBreak' },
            text('на сайті', [link('https://example.com/a?b=1')]),
            text('пошта', [link('mailto:team@example.com')]),
          ),
          { type: 'horizontalRule' },
          { type: 'paragraph' },
        ),
      ),
    ).toBe(true);
  });

  it('refuses a node the editor does not have', () => {
    for (const type of ['image', 'bulletList', 'codeBlock', 'blockquote']) {
      expect(accepts(doc({ type }))).toBe(false);
    }
  });

  it('refuses a mark the editor does not have', () => {
    for (const type of ['underline', 'code', 'strike', 'highlight']) {
      expect(accepts(doc(paragraph(text('a', [{ type }]))))).toBe(false);
    }
  });

  it('takes only the headings of the two levels', () => {
    for (const level of [1, 4, 0, '2']) {
      expect(
        accepts(
          doc({ type: 'heading', attrs: { level }, content: [text('a')] }),
        ),
      ).toBe(false);
    }
  });

  it('refuses a document that is not one, or has nothing in it', () => {
    expect(accepts(null)).toBe(false);
    expect(accepts({ type: 'paragraph' })).toBe(false);
    expect(messagesOf(doc())).toEqual(['Текст не може бути порожнім']);
    expect(accepts(doc(paragraph(text(''))))).toBe(false);
  });

  describe('links', () => {
    it.each([
      'javascript:alert(1)',
      'data:text/html,<script>1</script>',
      'ftp://example.com',
      '/budget',
      'example.com',
      'https://a b',
      'https://example.com/a b',
      'mailto:a b',
      '',
    ])('refuse %s', (href) => {
      expect(accepts(doc(paragraph(text('a', [link(href)]))))).toBe(false);
    });

    it('say what they may start with', () => {
      expect(
        messagesOf(doc(paragraph(text('a', [link('javascript:alert(1)')])))),
      ).toEqual(['Посилання має починатися з http://, https:// або mailto:']);
    });

    it('always open in a new tab and are not followed, whatever the client sends', () => {
      const parsed = CodexContent.parse(
        doc(
          paragraph(
            text('a', [
              {
                type: 'link',
                attrs: {
                  href: 'https://example.com',
                  target: '_self',
                  rel: 'author',
                  class: 'x',
                  onclick: 'alert(1)',
                },
              },
            ]),
          ),
        ),
      );

      expect(parsed.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'a',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://example.com',
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
                  class: null,
                },
              },
            ],
          },
        ],
      });
    });
  });

  describe('size', () => {
    it('takes as many blocks as the limit and no more', () => {
      const blocks = (count: number) =>
        doc(...Array.from({ length: count }, () => paragraph(text('a'))));

      expect(accepts(blocks(MAX_CODEX_BLOCKS))).toBe(true);
      expect(messagesOf(blocks(MAX_CODEX_BLOCKS + 1))).toEqual([
        'Забагато блоків',
      ]);
    });

    it('refuses a text that is too long as a whole', () => {
      const long = 'a'.repeat(10_000);
      const big = doc(
        ...Array.from({ length: 25 }, () => paragraph(text(long))),
      );

      expect(messagesOf(big)).toEqual(['Текст завеликий']);
    });
  });

  it('drops the keys it does not know', () => {
    expect(
      CodexContent.parse({
        type: 'doc',
        extra: 1,
        content: [{ type: 'paragraph', attrs: { textAlign: 'right' } }],
      }),
    ).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });
});

describe('SaveCodexData', () => {
  it('wants the document under `content`', () => {
    expect(SaveCodexData.safeParse(doc(paragraph(text('a')))).success).toBe(
      false,
    );
    expect(
      SaveCodexData.safeParse({ content: doc(paragraph(text('a'))) }).success,
    ).toBe(true);
  });
});

describe('the text the page starts with', () => {
  it('is a valid document, so the first save of it is accepted too', () => {
    expect(CodexContent.safeParse(DEFAULT_CODEX).success).toBe(true);
  });

  it('is the Codex of the team: eight sections with a rule between them', () => {
    const blocks = DEFAULT_CODEX.content;
    const headings = blocks.filter((block) => block.type === 'heading');

    expect(headings).toHaveLength(8);
    expect(headings.map((h) => h.content?.[0])).toEqual(
      [
        '1. Вступ',
        '2. Загальні положення',
        '3. Участь в команді',
        '4. Ролі',
        '5. Проєкти',
        '6. Крихти',
        '7. Замовлення',
        '8. Прикінцеві положення',
      ].map((value) => ({ type: 'text', text: value })),
    );
    expect(blocks.filter((b) => b.type === 'horizontalRule')).toHaveLength(7);
    expect(blocks[0].type).toBe('heading');
  });

  it("has no empty paragraphs, the space between them is the page's", () => {
    expect(
      DEFAULT_CODEX.content.filter(
        (block) => block.type === 'paragraph' && !block.content?.length,
      ),
    ).toEqual([]);
  });
});
