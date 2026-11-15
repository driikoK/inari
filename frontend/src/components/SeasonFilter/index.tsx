import { FC } from 'react';

import { recentSeasons } from '@/pages/Budget/const/options';
import { todayDay } from '@/pages/Projects/const/options';
import { seasonLabel } from '@/pages/Proposals/const/options';
import { FIRST_SEASON_YEAR, seasonOptions } from '@/utils/constants';
import SelectField from '../SelectField';

interface SeasonFilterProps {
  season: string | undefined;
  year: number | string | undefined;
  onChange: (season: string | undefined, year: number | undefined) => void;
}

// Every season from the first one the team has data for to the one that is going on, the newest
// first. A season and a year are one choice, so one cannot be left without the other.
const seasonsToNow = () => {
  const [current] = recentSeasons(todayDay(), 1);
  const passed =
    (current.year - FIRST_SEASON_YEAR) * seasonOptions.length +
    seasonOptions.findIndex(({ value }) => value === current.season) +
    1;

  return recentSeasons(todayDay(), Math.max(passed, 1));
};

const keyOf = (season: string, year: number | string) => `${season} ${year}`;

export const SeasonFilter: FC<SeasonFilterProps> = ({ season, year, onChange }) => {
  const options = seasonsToNow().map((item) => ({
    value: keyOf(item.season, item.year),
    label: seasonLabel(item.season, item.year),
  }));

  const handleChange = (value: string | undefined) => {
    if (!value) return onChange(undefined, undefined);

    const [chosenSeason, chosenYear] = value.split(' ');

    onChange(chosenSeason, Number(chosenYear));
  };

  return (
    <SelectField
      label="Сезон"
      value={season && year ? keyOf(season, year) : undefined}
      onChange={handleChange}
      options={options}
    />
  );
};
