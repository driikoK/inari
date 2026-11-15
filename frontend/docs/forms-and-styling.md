# Forms, deleting and styling

Part of the frontend guide, see [CLAUDE.md](../CLAUDE.md).

## Forms and validation (Zod)

- Schemas live in each page's `const/form.ts` as factories (`createTrackFormSchema(coins)`, …) and are passed to `zodResolver`.
- Annotate the factory's return type as `z.ZodType<FormValues, FormValues>` so the compiler checks the schema against the form's interface.
- Zod strips keys that are not in the schema, so declare every field the form has, or an optional one (a `note`, say) is silently lost.
- Required fields use `z.string({ error: msg }).min(1, msg)`, which keeps the Ukrainian "Обов’язкове поле" style messages the UI shows through `ErrorMessage`.
- A `.check()` chained after `.min()`/`.max()` is skipped when those fail, so put custom checks first. `z.number({ error })` replaces the message of every issue, give the range checks their own messages.
- URL fields: `.trim().min(1).pipe(httpUrl)`, which reports "required" before "invalid link". `httpUrl` and `LINK_MESSAGE` live in `utils/validation.ts`.
- Values the backend also defines are enums in `types/index.ts`, next to `ANIME_TYPE`: `PROPOSAL_FUNDING`, `TITLE_KIND` (the form value for онґоїнґ / стареча) and `PROJECT_MARK`, plus `NO_FUNDING` for the "not set" choice of a funding toggle. Compare and build with them (`funding === PROPOSAL_FUNDING.PATRON`, `z.enum(TITLE_KIND)`), never with a bare `'patron'`. Their labels live in `pages/Proposals/const/options.ts` (`fundingOptions`, `kindOptions`), shared with the Projects form. Roles are not an enum: the one list of roles with labels comes from `GET /members/roles` through `useRolesStore`, and a role is just a string. Every page or dialog that shows roles calls `getRoles()` (it is cached), as the Proposals page, the Projects page and `ProjectFormDialog` do.
- A date a form shows as "today" must come from `todayDay()` in `pages/Projects/const/options.ts`, which uses Kyiv time like the backend, not from the browser's clock.
- Errors on a field array element go on a path like `membersInfo.dubs.1.coins`, which is how `FormField` finds them.

## Deleting things

Follow the Settings and Rating pages: an `actions` column (`GridActionsColDef` with a `GridActionsCellItem` and `DeleteOutlined` icon) shown only when `hasAccess(SUBJECTS.DELETE_*)`, a `memberToDelete`/`userToDelete` state, and `ConfirmDeleteDialog` (`src/components/ConfirmDeleteDialog`) with a message that says what is kept or lost. The Axios interceptor already toasts the server's error, so the `catch` can be empty with a comment saying so. `autoFocusCancel` puts the focus on «Скасувати» for what cannot be taken back (the bulk delete of tracks uses it). It is set when the dialog has finished opening, because the dialog takes the focus itself first and an `autoFocus` on the button loses to it.

## Styling

**Design tokens** — `src/theme/global.css` defines all CSS custom properties and is the source of truth for colors and typography:

```
--bg, --surface, --surface-2, --surface-3   (backgrounds)
--accent, --accent-dim, --accent-glow        (oklch purple)
--border, --border-hover
--text, --text-muted, --text-faint
--red, --green, --teal, --orange, --yellow   (semantic colours)
--font-head, --font-body
--radius, --radius-sm
```

`global.css` also defines `fade-up` / `fade-up-1…4` animation utility classes.

**MUI theme** — `src/theme/mui-theme.ts` mirrors those tokens for MUI components. Add `import type {} from '@mui/x-data-grid/themeAugmentation'` when adding DataGrid overrides.

**Date fields** — use `DateInput` (`src/components/DateInput`, props `min` and `max` as `YYYY-MM-DD`), not a bare `TextField type="date"`. The browser opens its calendar only from the small icon of a native date field, so `DateInput` opens it from a click anywhere in the frame of the field (`showPicker()` on the frame, which also covers the padding around the `<input>`). The site is dark only, and `global.css` sets `color-scheme: dark` on `:root` so that the icon is drawn white (it was black on the dark background) and the calendar popup is dark too.

**Toasts** — one `<Toaster>` in `src/index.tsx`, styled with the tokens of `global.css` (surface, text, font, radius). Its `style` sets the padding on purpose: `react-hot-toast` wraps its own styles in `:where()`, which has no specificity, so the `* { padding: 0 }` reset of `global.css` would win and the toast would have no padding. Do the same for any other third-party widget that looks unpadded.

**New component styling** — use MUI `sx` prop for MUI components; use `.module.scss` CSS modules for plain HTML elements. Reference design tokens via `var(--accent)` etc. in SCSS.

**Do not create new styled components.** Existing pages still have legacy `styles.ts` files that use styled-components, but new code must not add more. `src/styled.d.ts` types `DefaultTheme` as the theme object so `theme.mq` and friends type-check.
