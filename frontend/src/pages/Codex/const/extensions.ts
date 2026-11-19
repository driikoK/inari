import StarterKit from '@tiptap/starter-kit';

const ALLOWED_LINK = /^(https?|mailto):/i;

// The browser's `URL` takes «https://a b» and writes «https://a%20b/», Node does not, so a space is
// refused here as it is on the backend, or the save would be turned down
export const isValidHref = (href: string) => {
  if (/\s/.test(href) || !ALLOWED_LINK.test(href)) return false;

  try {
    return Boolean(new URL(href).protocol);
  } catch {
    return false;
  }
};

// Has to stay the same set as CodexContent in backend/src/codex/data/codex.data.ts
export const codexExtensions = [
  StarterKit.configure({
    blockquote: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    trailingNode: false,
    heading: { levels: [2, 3] },
    link: {
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      defaultProtocol: 'https',
      protocols: ['mailto'],
      isAllowedUri: isValidHref,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
    },
  }),
];

export const normalizeHref = (value: string) => {
  const href = value.trim();

  if (!href || ALLOWED_LINK.test(href)) return href;
  if (/^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(href)) return `mailto:${href}`;

  return `https://${href}`;
};
