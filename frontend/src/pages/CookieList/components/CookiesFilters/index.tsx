import { SelectWrapper } from './styles';
import { SearchSelect, SeasonFilter, SelectField } from '@/components';
import { useMembersStore, useRolesStore, useTitlesStore, useTracksStore } from '@/stores';
import type { TrackFilters } from '@/stores/useTracksStore';
import { notifyFailure } from '@/utils/request';

// The filters are what the store has applied, so they are still there when the admin comes back to
// the page, and what is on the screen is always what was asked of the server.
export const CookiesFilters = () => {
  const { getTracks, appliedFilters } = useTracksStore();
  const titles = useTitlesStore((state) => state.titles);
  const roles = useRolesStore((state) => state.roles);
  const membersDictionary = useMembersStore((state) => state.membersDictionary);

  // A new filter starts from the first page: the page the admin was on may not exist in the shorter
  // result, and would show nothing.
  const apply = (changes: Partial<TrackFilters>) =>
    getTracks({ ...appliedFilters, ...changes, page: 1 }).catch(notifyFailure);

  return (
    <SelectWrapper>
      <SearchSelect
        label="Нікнейм"
        value={appliedFilters.nickname}
        onChange={(nickname) => apply({ nickname })}
        noOptionsText="Нікнейм не знайдено"
        options={membersDictionary.map(({ nickname }) => ({ value: nickname, label: nickname }))}
      />

      <SearchSelect
        label="Проєкт"
        value={appliedFilters.projectId}
        onChange={(projectId) => apply({ projectId })}
        noOptionsText="Проєкт не знайдено"
        options={titles.map(({ _id, ukrName, romajiName, codeName, isFinished }) => ({
          value: _id,
          label: ukrName,
          hint: romajiName !== ukrName ? romajiName : undefined,
          keywords: codeName,
          group: isFinished ? 'Завершені' : 'Триває',
        }))}
      />

      <SelectField
        label="Роль"
        value={appliedFilters.typeRole}
        onChange={(typeRole) => apply({ typeRole })}
        options={roles.map((role) => ({ value: role.value, label: role.label }))}
      />

      <SeasonFilter
        season={appliedFilters.season}
        year={appliedFilters.year}
        onChange={(season, year) =>
          apply({ season, year: year === undefined ? undefined : String(year) })
        }
      />
    </SelectWrapper>
  );
};
