# Nicknames, accounts and the Rating

Part of the frontend guide, see [CLAUDE.md](../CLAUDE.md).

## Nickname kind (team member / guest)

- `MemberType.kind` is `'team' | 'guest'`, and missing for nicknames that were never marked. Show that as «Не вказано» (editable) or a dash (read-only), never as an error. The «Тип» filter of the Rating offers only «Учасник команди» and «Гість», and no choice shows everybody, the unmarked included; the backend still takes `kind=unmarked` (`GET /members`), but nothing in the frontend asks for it.
- Both "add nickname" dialogs use `MemberKindToggle` with nothing preselected, and save stays disabled until a kind is chosen.
- The Rating page has a `Тип` column (`MemberKindCell`): a select for admins (`EDIT_MEMBER_KIND`), plain text for everyone else. It saves through `updateMemberKind`, never through `updateMember`, because a season-filtered row holds the season's coins and would overwrite the total.
- In the track form a row's «Гість» box follows the kind of its nickname, whether the nickname was picked or prefilled from the previous episode (an effect in `FormField`'s `InputFields`, keyed on the nickname and its kind). The box stays editable until the nickname changes, and `isGuest` is still sent per track line.

## Linking an account to a nickname

- Settings (`pages/Settings/`) has the columns «Нікнейм в системі» (the login) and «Нікнейм в команді». The second is `TeamNicknameCell`: an Autocomplete over `membersDictionary` that links an existing nickname, shows one held by another account as «— зайнято» and disabled, offers «Створити «X»» for an unknown name (sent with `create: true`, then members are refetched) and unlinks with the clear button. It saves through `setUserNickname` in `useAuthStore`, which refetches the user list.
- The Autocomplete stops `keydown` from bubbling (`onKeyDown` with `stopPropagation`). Without it the DataGrid treats Space as a navigation key and swallows it, so a name with a space cannot be typed. Do the same for any input you put in `renderCell`.
- The Profile (`pages/Profile/components/CoinsBalance`) reads `GET /members/me` through `getMyCoins`, which returns the answer instead of storing it, so a second login never sees the previous account's balance. It shows the linked nickname with the total and the current season's coins, or a hint when no nickname is linked.

## Rating coins total

- `CoinsTotalSummary` (`pages/CookieRating/components/`) sits above the Rating table and is shown only with `SUBJECTS.VIEW_COINS_TOTAL` (admins). The number comes from `GET /members/coins-total` through `getCoinsTotal` in `useMembersStore`, never from the rows of the table, because the sum ignores the kind and nickname filters and only follows the season. The page calls `resetFilters` when it unmounts: `RatingFilters` keeps its selections in local state, so without it a returning admin would still find the last season in `appliedFilters`.
- The «Враховувати гостей» switch is sent as `includeGuests` and remembered in `localStorage` (`rating.includeGuests`, on by default). Every toggle is a request, the backend decides what the sum holds.
- The store keeps the last params while the block is mounted, and `addMember`, `updateMember`, `updateMemberKind` and `deleteMember` refetch with them. The block clears them on unmount, so a non-admin never calls the admin-only endpoint. An answer for params the admin has already left is dropped.
