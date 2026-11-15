# Proposals and Projects pages

Part of the frontend guide, see [CLAUDE.md](../CLAUDE.md).

## Proposals page

- `src/pages/Proposals/`: season tabs, a `ProposalCard` per title (participants grouped by role, every role of the list listed, a dash for an empty one), `JoinDialog`, and admin-only dialogs for seasons, titles and participants. Admin controls are gated by `SUBJECTS.MANAGE_PROPOSALS`, which only hides UI.
- The tab is remembered as soon as it is resolved. Deriving "the first open season" on every render makes the page jump to another season when the current one is closed.
- The quota «Ваша квота: n з 3» is only counted for display. The backend sends the limit (`maxPerPerson`) and refuses a join over it. A full member sees «Ліміт: n з n» on the other titles, and can still edit or withdraw where already joined.
- A closed season shows «Сезон закрито» in place of the join button. Deleting a season is offered only when it is closed.
- Curators (`MANAGE_PROJECTS`) get «Запустити проєкт» on a proposal that is not a project yet, which opens the project form pre-filled. A launched proposal shows a «Запущено» chip linking to `/projects?project=<id>` instead, and the proposals list is refetched after launching.

## Projects page

- `src/pages/Projects/`: season tabs (the server decides which seasons exist and flags the current one), a statistics row, a `ProjectTile` per project, and `ProjectCard` as a dialog. Curator-only: `ProjectFormDialog` (create, edit, and launch from a proposal), `FinishProjectDialog` and the delete confirmation, all gated by `SUBJECTS.MANAGE_PROJECTS`.
- Nothing about seasons, debts or statistics is computed in the browser. Each project in a season arrives with its `mark` (`ongoing`, `old` or `debt`) for that season, and the page only displays it. A project appears under every season it was on the layout of.
- On the current season's tab a finished tile is greyed, and disabled for a member. On a past tab nothing is greyed and every card opens.
- `ProjectFormDialog` loads the members first and mounts `ProjectForm` only after they are in, so a proposal's paws can be matched to nicknames (case-insensitive) when the form opens. An unmatched paw becomes an empty row that says «З пропозиції: …» and blocks saving until a nickname is picked or the row is removed. Rows carry a client-only `key`, which `toProjectPayload` drops.
- The create form has a «Вже завершено» checkbox, for backfilling old titles, that reveals the end date and «Завершено вчасно». The edit form shows them only for a project that is already finished, and for a running one they come from the `FinishProjectDialog`. `isFinished` is a form value, not an argument of the schema factory.
- The card reuses `ParticipantsByRole` from the Proposals page, mapping `nickname` to `userName`. Both read the roles from `useRolesStore`.
